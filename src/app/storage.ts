import { FileContent } from "use-file-picker/types";
import { Zone } from "./types";

const COLLECTIONS = "collections";
const IMAGES = "images";
const PAGE_NUMBER = "pageNumber";

export type CollectionInfo = {
  name: string;
  zones: Array<Zone>;
  length: number;
  position: number;
};

type LocalStorageCollections = {
  [key: string]: CollectionInfo;
};

type DBImage = {
  filename: string;
  pageNumber: number;
  imageData: ArrayBuffer;
};

export function getLSAll(): LocalStorageCollections {
  return JSON.parse(localStorage.getItem(COLLECTIONS) ?? "{}");
}

function setLSAll(collections: LocalStorageCollections) {
  localStorage.setItem(COLLECTIONS, JSON.stringify(collections));
}

export function getLSCollectionInfo(name: string): CollectionInfo | null {
  const ls = getLSAll();
  return ls[name];
}

function setLSCollectionInfo(name: string, collectionInfo: CollectionInfo) {
  const current = getLSAll();
  current[name] = collectionInfo;
  setLSAll(current);
}

export function setCurrentPage(name: string, page: number) {
  const current = getLSCollectionInfo(name);
  if (!current) return null;
  current.position = page;
  setLSCollectionInfo(name, current);
}

export function storeCollection(
  name: string,
  images: FileContent<ArrayBuffer>[],
  zones: Array<Zone>
) {
  const collectionInfo = getLSCollectionInfo(name);
  if (collectionInfo) {
    console.log("Collection already exists!");
    // tODO
    return;
  }

  setLSCollectionInfo(name, {
    name,
    zones,
    length: images.length,
    position: 1,
  });

  const dbName = name;
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => {
    const db = request.result;
    const objectStore = db.createObjectStore(IMAGES, { keyPath: PAGE_NUMBER });

    objectStore.transaction.oncomplete = () => {
      const imagesObjectStore = db
        .transaction(IMAGES, "readwrite")
        .objectStore(IMAGES);
      images.forEach((image, index) => {
        const dbImage: DBImage = {
          filename: image.name,
          pageNumber: index + 1,
          imageData: image.content,
        };
        imagesObjectStore.add(dbImage);
      });
    };
  };
}

export function getPageData(
  name: string,
  start: number,
  length: number,
  callback: (image: Array<ArrayBuffer>) => void
) {
  const result: Array<ArrayBuffer> = [];
  const range = IDBKeyRange.bound(start + 1, start + length);
  const dbName = name;
  const request = indexedDB.open(dbName);
  request.onsuccess = () => {
    const db = request.result;
    db.transaction(IMAGES).objectStore(IMAGES).openCursor(range).onsuccess = (
      event
    ) => {
      //@ts-ignore
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value as DBImage;
        result[item.pageNumber - 1] = item.imageData;

        cursor.continue();
      } else {
        callback(result);
      }
    };
  };
}
