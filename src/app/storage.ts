import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';

export function useCollectionLocalStorage(collectionName: string | undefined) {
  return {
    originalCount: useLocalStorage(`${collectionName}-orig`, parseInt),
    translatedCount: useLocalStorage(`${collectionName}-transl`, parseInt),
  };
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

function getImageName(index: number, indexBase = 1000000, ext = 'png') {
  return `${indexBase + index + 1}.${ext}`;
}

const FILE_DATA = 'FILE_DATA';
const READONLY = 'readonly';
function getImageDataFromIDB(
  dbName: string,
  type: string,
  index: number,
  callback: (imageData: ArrayBuffer) => void
) {
  const range = IDBKeyRange.only(`${dbName}/${type}/${getImageName(index)}`);
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

  useEffect(() => {
    getImageDataFromIDB(
      `/idbfs/${collectionName}`,
      type,
      index,
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
  }, [collectionName, index, type]);

  return blobURL;
}
