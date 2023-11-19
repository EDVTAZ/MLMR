import { FileContent } from "use-file-picker/types";
import {
  CollectionInfo,
  CompleteZone,
  DBImage,
  LocalStoragReadingPair,
  LocalStoragReadingPairs,
  LocalStorageCollections,
  ReadingPair,
} from "./types";

const COLLECTIONS = "collections";
const PAIRINGS = "pairings";
const IMAGES = "images";
const PAGE_NUMBER = "pageNumber";

function getLSPairingsAll(): LocalStoragReadingPairs {
  return JSON.parse(localStorage.getItem(PAIRINGS) ?? "{}");
}

function setLSPairingsAll(pairings: LocalStoragReadingPairs) {
  localStorage.setItem(PAIRINGS, JSON.stringify(pairings));
}

export function getLSPairingInfo(name: string): LocalStoragReadingPair | null {
  const ls = getLSPairingsAll();
  return ls[name];
}

export function getPairingInfo(name: string): ReadingPair | null {
  const lsP = getLSPairingInfo(name);
  if (lsP == null) return null;
  const c1 = getLSCollectionInfo(lsP.collections[0]);
  const c2 = getLSCollectionInfo(lsP.collections[1]);
  if (c1 == null || c2 == null) return null;
  return { ...lsP, collections: [c1, c2] };
}

function setLSPairingInfo(name: string, lsPairingInfo: LocalStoragReadingPair) {
  const current = getLSPairingsAll();
  current[name] = lsPairingInfo;
  setLSPairingsAll(current);
}

export function getLSCollectionsAll(): LocalStorageCollections {
  return JSON.parse(localStorage.getItem(COLLECTIONS) ?? "{}");
}

function setLSCollectionsAll(collections: LocalStorageCollections) {
  localStorage.setItem(COLLECTIONS, JSON.stringify(collections));
}

export function getLSCollectionInfo(name: string): CollectionInfo | null {
  const ls = getLSCollectionsAll();
  return ls[name];
}

function setLSCollectionInfo(name: string, collectionInfo: CollectionInfo) {
  const current = getLSCollectionsAll();
  current[name] = collectionInfo;
  setLSCollectionsAll(current);
}

export function getCurrentPage(name: string): number {
  const current = getLSPairingInfo(name);
  if (!current) return 0;
  return current.position;
}

export function setCurrentPage(name: string, page: number) {
  const current = getLSPairingInfo(name);
  if (!current) return null;
  current.position = page;
  setLSPairingInfo(name, current);
}

export function storePairing(
  name: string,
  collectionName1: string,
  collectionName2: string,
  zones1: Array<CompleteZone>,
  zones2: Array<CompleteZone>
) {
  const pairingInfo = getLSPairingInfo(name);
  if (pairingInfo) {
    console.log("Pairing already exists!");
    // tODO
    return;
  }

  setLSPairingInfo(name, {
    name,
    collections: [collectionName1, collectionName2],
    zoness: [zones1, zones2],
    position: 0,
  });
}

export function storeCollection(
  name: string,
  images: FileContent<ArrayBuffer>[]
) {
  const collectionInfo = getLSCollectionInfo(name);
  if (collectionInfo) {
    console.log("Collection already exists!");
    // tODO
    return;
  }

  setLSCollectionInfo(name, {
    name,
    length: images.length,
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
  callback: (image: Array<DBImage>) => void
) {
  const result: Array<DBImage> = [];
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
        result[item.pageNumber - 1] = item;

        cursor.continue();
      } else {
        callback(result);
      }
    };
  };
}
