import { useEffect, useLayoutEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const REFRESH_MOD = 10;

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

export function deleteCollection(collectionName: string) {
  localStorage.removeItem(`${collectionName}-orig`);
  localStorage.removeItem(`${collectionName}-position`);
  deleteIDB(collectionName);
}

function deleteIDB(collectionName: string) {
  const DBDeleteRequest = indexedDB.deleteDatabase(`/idbfs/${collectionName}`);

  DBDeleteRequest.onerror = (event) => {
    console.error(`Error deleting ${collectionName} database. `, event);
    setTimeout(() => {
      deleteIDB(collectionName);
    }, 100);
  };
  DBDeleteRequest.onsuccess = (event) => {
    console.log(`${collectionName} database deleted successfully!`);
  };
}

function getFileName(index: number, ext = 'png', indexBase = 1000000) {
  return `${indexBase + index + 1}.${ext}`;
}

const FILE_DATA = 'FILE_DATA';
const READONLY = 'readonly';
function getFileDataFromIDB(
  dbName: string,
  file: string,
  callback: (imageData: ArrayBuffer) => void
) {
  const range = IDBKeyRange.only(`${dbName}/${file}`);
  const request = indexedDB.open(dbName);
  request.onsuccess = () => {
    const db = request.result;
    db
      .transaction(FILE_DATA, READONLY)
      .objectStore(FILE_DATA)
      .openCursor(range).onsuccess = (event) => {
      if (event.target) {
        //@ts-ignore
        const cursor = event.target.result;
        if (cursor) {
          callback(cursor.value.contents as ArrayBuffer);
          cursor.continue();
        }
      }
    };
  };
}

export function useIDBImage(
  collectionName: string,
  type: 'out_orig' | 'out_transl',
  index: number,
  shouldLoad: boolean
) {
  const [blobURL, setBlobURL] = useState('');
  const [cacheV, setCacheV] = useState(0);

  useEffect(() => {
    if (!shouldLoad) return;

    const timeoutID = setTimeout(() => {
      getFileDataFromIDB(
        `/idbfs/${collectionName}`,
        `${type}/${getFileName(index, 'png')}`,
        (imageData) => {
          setBlobURL((oldBlobURL) => {
            URL.revokeObjectURL(oldBlobURL);
            return URL.createObjectURL(
              new Blob([imageData], { type: 'image/*' })
            );
          });
        }
      );
    }, 200);

    return () => {
      clearTimeout(timeoutID);
      setBlobURL((oldBlobURL) => {
        URL.revokeObjectURL(oldBlobURL);
        return '';
      });
    };
  }, [collectionName, index, type, cacheV, shouldLoad]);

  return { blobURL, refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD) };
}

export function useIDBImageInfo(
  collectionName: string,
  type: 'out_orig' | 'out_transl',
  index: number
) {
  // height/width
  const [ratio, setRatio] = useState(0);
  const [cacheV, setCacheV] = useState(0);

  useEffect(() => {
    getFileDataFromIDB(
      `/idbfs/${collectionName}`,
      `${type}/${getFileName(index, 'txt')}`,
      (data) => {
        const dataString = new TextDecoder('utf-8').decode(data);
        const [width, height] = dataString.split(':').map((i) => parseInt(i));
        setRatio(width / height);
      }
    );
  }, [collectionName, index, type, cacheV]);

  return { ratio, refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD) };
}
