import { atom } from 'jotai';
import type { Atom, Getter, WritableAtom } from 'jotai';

type AnyAtomValue = unknown;
type AnyAtom = Atom<AnyAtomValue>;
type CreatedAt = number;

type WriteGetter = Parameters<WritableAtom<unknown, unknown>['write']>[0];
type Read<Value> = (get: Getter) => Value;

type Options = {
  size?: number;
  shouldRemove?: (
    createdAt: CreatedAt,
    value: AnyAtomValue,
    map: Map<AnyAtom, AnyAtomValue>,
  ) => boolean;
  areEqual?: <V>(a: V, b: V) => boolean;
};

export function atomWithCache<Value>(
  read: Read<Value>,
  options?: Options,
): Atom<Value> {
  const is = options?.areEqual || Object.is;
  // this cache is common across Provider components
  const cache: [CreatedAt, AnyAtomValue, Map<AnyAtom, AnyAtomValue>][] = [];
  const writeGetterAtom = atom<[WriteGetter] | null>(null);
  const baseAtom = atom(
    (get) => {
      const writeGetter = get(writeGetterAtom)?.[0];
      if (writeGetter) {
        const index = cache.findIndex((item) =>
          Array.from(item[2]).every(([a, v]) => {
            const vv = writeGetter(a, { unstable_promise: true });
            if (vv instanceof Promise) {
              return false;
            }
            return is(v, vv);
          }),
        );
        if (index >= 0) {
          if (options?.shouldRemove?.(...cache[index])) {
            cache.splice(index, 1);
          } else {
            cache[index][2].forEach((_, a) => get(a)); // touch atoms
            return cache[index][1] as Value;
          }
        }
      }
      const map = new Map<AnyAtom, AnyAtomValue>();
      const value = read((a) => {
        const v = get(a);
        map.set(a, v);
        return v;
      });
      cache.unshift([Date.now(), value, map]);
      if (options?.size && options.size < cache.length) {
        cache.pop();
      }
      return value;
    },
    (get, set, isInit) => {
      if (isInit) {
        set(writeGetterAtom, [get]);
      } else {
        set(writeGetterAtom, null);
      }
    },
  );
  baseAtom.onMount = (init) => {
    init(true);
    return () => init(false);
  };
  const derivedAtom = atom((get) => get(baseAtom));
  return derivedAtom;
}
