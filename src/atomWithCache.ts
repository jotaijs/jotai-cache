import { atom } from 'jotai/vanilla';
import type { Atom, WritableAtom } from 'jotai/vanilla';

type AnyAtomValue = unknown;
type AnyAtom = Atom<AnyAtomValue>;
type CreatedAt = number;

type Read<Value> = Atom<Value>['read'];

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
): Atom<Promise<Awaited<Value>>> {
  const is = options?.areEqual || Object.is;
  // this cache is common across Provider components
  const cache: [CreatedAt, Awaited<Value>, Map<AnyAtom, AnyAtomValue>][] = [];

  const baseAtom: WritableAtom<
    Promise<Awaited<Value>>,
    [AnyAtom],
    AnyAtomValue
  > = atom(
    async (get, { setSelf: writeGetter, ...opts }): Promise<Awaited<Value>> => {
      const index = cache.findIndex((item) =>
        Array.from(item[2]).every(([a, v]) => is(v, writeGetter(a))),
      );
      if (index >= 0) {
        const item = cache[index] as (typeof cache)[number];
        if (options?.shouldRemove?.(...item)) {
          cache.splice(index, 1);
        } else {
          item[2].forEach((_, a) => get(a)); // touch atoms
          return item[1] as Awaited<Value>;
        }
      }
      const map = new Map<AnyAtom, AnyAtomValue>();
      const value = await read(
        (a) => {
          const v = get(a);
          map.set(a, v);
          return v;
        },
        opts as typeof opts & { setSelf: never },
      );
      cache.unshift([Date.now(), value, map]);
      if (options?.size && options.size < cache.length) {
        cache.pop();
      }
      return value;
    },
    (get, _set, anAtom: AnyAtom) => get(anAtom), // HACK HACK HACK
  );

  if (process.env.NODE_ENV !== 'production') {
    baseAtom.debugPrivate = true;
  }

  const derivedAtom = atom((get) => get(baseAtom));
  return derivedAtom;
}
