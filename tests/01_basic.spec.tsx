import { expect, test } from 'vitest';
import { atomWithCache } from 'jotai-cache';

test('should export functions', () => {
  expect(atomWithCache).toBeDefined();
});
