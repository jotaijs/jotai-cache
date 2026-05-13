import { expect, test } from 'vitest';
import { createStore, atom } from 'jotai/vanilla';
import { atomWithCache, atomWithCacheAndRefresh } from 'jotai-cache';

test('should export atomWithCacheAndRefresh', () => {
  expect(atomWithCacheAndRefresh).toBeDefined();
  expect(atomWithCache).toBeDefined();
});

test('atomWithCacheAndRefresh caches by default and invalidates on set', async () => {
  const store = createStore();
  const depAtom = atom(1);
  let calls = 0;
  const cached = atomWithCacheAndRefresh(async (get) => {
    calls += 1;
    return get(depAtom);
  });

  expect(await store.get(cached)).toBe(1);
  expect(await store.get(cached)).toBe(1);
  expect(calls).toBe(1);

  store.set(cached);

  expect(await store.get(cached)).toBe(1);
  expect(calls).toBe(2);
});

test('atomWithCacheAndRefresh re-reads after dep changes (same as atomWithCache)', async () => {
  const store = createStore();
  const depAtom = atom(1);
  let calls = 0;
  const cached = atomWithCacheAndRefresh(async (get) => {
    calls += 1;
    return get(depAtom);
  });

  expect(await store.get(cached)).toBe(1);
  store.set(depAtom, 2);
  expect(await store.get(cached)).toBe(2);
  expect(calls).toBe(2);
});
