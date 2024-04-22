import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';

export function useCollectionLocalStorage(collectionName: string | undefined) {
  return useLocalStorage(`${collectionName}-orig`, parseInt);
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
  value: string;
  setValue: Dispatch<string>;
};
function useLocalStorage<T>(
  key: string,
  parse: (param: string) => T
): {
  value: T;
  setValue: Dispatch<T>;
};
function useLocalStorage(key: string, parse = (param: string) => param) {
  const [value, setValue] = useState(parse(localStorage[key]));

  useEffect(() => {
    setValue(parse(localStorage[key]));
  }, [key, setValue, parse]);

  useEffect(() => {
    localStorage[key] = value;
  }, [key, value]);

  return { value, setValue };
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
  index: number
) {
  const [blobURL, setBlobURL] = useState('');
  const [cacheV, setCacheV] = useState(0);

  useEffect(() => {
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
  }, [collectionName, index, type, cacheV]);

  return { blobURL, refresh: () => setCacheV((v) => v + 1) };
}

export function useIDBImageInfo(
  collectionName: string,
  type: 'out_orig' | 'out_transl',
  index: number
) {
  // height/width
  const [ratio, setRatio] = useState(-1);
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
