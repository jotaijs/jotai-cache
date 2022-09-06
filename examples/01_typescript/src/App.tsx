import React, { Suspense } from 'react';
import { atom, useAtom } from 'jotai';
import { atomWithCache } from 'jotai-cache';

const idAtom = atom(1);

const normalAtom = atom(async (get) => {
  const id = get(idAtom);
  const response = await fetch(`https://reqres.in/api/users/${id}?delay=1`);
  return response.json();
});

const cachedAtom = atomWithCache(async (get) => {
  const id = get(idAtom);
  const response = await fetch(`https://reqres.in/api/users/${id}?delay=1`);
  return response.json();
});

const NormalUser = () => {
  const [{ data }] = useAtom(normalAtom);
  return (
    <div>
      <h1>User (normal atom)</h1>
      <ul>
        <li>ID: {data.id}</li>
        <li>First name: {data.first_name}</li>
        <li>Last name: {data.last_name}</li>
      </ul>
    </div>
  );
};

const CachedUser = () => {
  const [{ data }] = useAtom(cachedAtom);
  return (
    <div>
      <h1>User (cached atom)</h1>
      <ul>
        <li>ID: {data.id}</li>
        <li>First name: {data.first_name}</li>
        <li>Last name: {data.last_name}</li>
      </ul>
    </div>
  );
};

const App = () => {
  const [id, setId] = useAtom(idAtom);
  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
      <hr />
      <Suspense fallback="Loading...">
        <CachedUser />
      </Suspense>
      <hr />
      <Suspense fallback="Loading...">
        <NormalUser />
      </Suspense>
    </div>
  );
};

export default App;
