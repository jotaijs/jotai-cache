import { expect, test } from 'vitest';
import { createStore, atom } from 'jotai/vanilla';
import { atomWithCache } from 'jotai-cache';

test('atomWithCache caches by default and invalidates on refresh action', async () => {
  const store = createStore();
  const depAtom = atom(1);
  let calls = 0;
  const cached = atomWithCache(async (get) => {
    calls += 1;
    return get(depAtom);
  });

  expect(await store.get(cached)).toBe(1);
  expect(await store.get(cached)).toBe(1);
  expect(calls).toBe(1);

  store.set(cached, { type: 'refresh' });

  expect(await store.get(cached)).toBe(1);
  expect(calls).toBe(2);
});

test('atomWithCache re-reads after dep changes', async () => {
  const store = createStore();
  const depAtom = atom(1);
  let calls = 0;
  const cached = atomWithCache(async (get) => {
    calls += 1;
    return get(depAtom);
  });

  expect(await store.get(cached)).toBe(1);
  store.set(depAtom, 2);
  expect(await store.get(cached)).toBe(2);
  expect(calls).toBe(2);
});
