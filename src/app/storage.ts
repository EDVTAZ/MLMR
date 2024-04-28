import { useEffect, useLayoutEffect, useState } from 'react';
import type { Dispatch } from 'react';

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

export function useCollectionNamesLocalStorage(): string[] {
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    const newCollections: string[] = [];
    for (let i = 0; i < localStorage.length; ++i) {
      const currentKey = localStorage.key(i);
      if (currentKey?.slice(-5) === '-orig') {
        newCollections.push(currentKey.slice(0, -5));
      }
    }
    setCollections(newCollections);
  }, []);

  return collections;
}

function useLocalStorage(key: string): {
  value: string | null;
  setValue: Dispatch<string | null>;
};
function useLocalStorage<T>(
  key: string,
  parse: (param: string) => T
): {
  value: T | null;
  setValue: Dispatch<T | null>;
};
function useLocalStorage<T>(
  key: string,
  parse: (param: string) => T,
  serialize: (param: T) => string
): {
  value: T | null;
  setValue: Dispatch<T | null>;
};
function useLocalStorage<T = string>(
  key: string,
  parse = (param: T) => param,
  serialize = (param: T) => param
) {
  const [value, setValue] = useState<T | null>(null);
  const safeSetValue = (v: T | null) => {
    if (v !== null) setValue(v);
  };

  // make sure we read everything before rendering
  useLayoutEffect(() => {
    try {
      safeSetValue(parse(localStorage[key]));
    } catch (e) {
      /* empty */
    }
  }, [key]);

  useEffect(() => {
    if (value !== null) localStorage[key] = serialize(value);
  }, [key, value]);

  return {
    value,
    setValue: safeSetValue,
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

    return () => {
      setBlobURL((oldBlobURL) => {
        URL.revokeObjectURL(oldBlobURL);
        return '';
      });
    };
  }, [collectionName, index, type, cacheV, shouldLoad]);

  return { blobURL, refresh: () => setCacheV((v) => v + 1) };
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
        setRatio(height / width);
      }
    );
  }, [collectionName, index, type, cacheV]);

  return { ratio, refresh: () => setCacheV((v) => v + 1) };
}
