import { useEffect, useLayoutEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { REFRESH_MOD } from './storage';

export function useBrightnessLocalStorage() {
  return useLocalStorage(`brightness`, (v) => (v ? parseFloat(v) : null));
}

export function useAlignmentInProgressLocalStorage() {
  return useLocalStorage(`alignment-in-progress`, (v) =>
    v === 'false' ? false : v
  );
}

export function useCollectionLocalStorage(collectionName: string | undefined) {
  return useLocalStorage(`${collectionName}-orig`, parseInt);
}

export function useCollectionPositionLocalStorage(
  collectionName: string | undefined
) {
  return useLocalStorage<{ page: number; percentage: number }>(
    `${collectionName}-position`,
    JSON.parse,
    JSON.stringify
  );
}

export function useCollectionNamesLocalStorage(): {
  collections: string[];
  refresh: () => void;
} {
  const [collections, setCollections] = useState<string[]>([]);
  const [cacheV, setCacheV] = useState(0);

  useEffect(() => {
    const newCollections: string[] = [];
    for (let i = 0; i < localStorage.length; ++i) {
      const currentKey = localStorage.key(i);
      if (currentKey?.slice(-5) === '-orig') {
        newCollections.push(currentKey.slice(0, -5));
      }
    }
    setCollections(newCollections);
  }, [cacheV]);

  return {
    collections,
    refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD),
  };
}

function useLocalStorage(key: string): {
  value: string | null;
  setValue: Dispatch<SetStateAction<string | null>>;
  refresh: () => void;
};
function useLocalStorage<T>(
  key: string,
  parse: (param: string) => T
): {
  value: T | null;
  setValue: Dispatch<SetStateAction<T | null>>;
  refresh: () => void;
};
function useLocalStorage<T>(
  key: string,
  parse: (param: string) => T,
  serialize: (param: T) => string
): {
  value: T | null;
  setValue: Dispatch<SetStateAction<T | null>>;
  refresh: () => void;
};
function useLocalStorage<T = string>(
  key: string,
  parse = (param: T) => param,
  serialize = (param: T) => param
) {
  const [value, setValue] = useState<T | null>(null);
  const [cacheV, setCacheV] = useState(0);
  const safeSetValue = (v: T | null) => {
    if (v !== null && v !== undefined) setValue(v);
  };

  // make sure we read everything before rendering
  useLayoutEffect(() => {
    try {
      safeSetValue(parse(localStorage[key]));
    } catch (e) {
      /* empty */
    }
  }, [key, cacheV]);

  useEffect(() => {
    if (value !== null) localStorage[key] = serialize(value);
  }, [key, value]);

  return {
    value,
    setValue: safeSetValue,
    refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD),
  };
}
