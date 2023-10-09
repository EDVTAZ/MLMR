import { FileContent } from "use-file-picker/dist/interfaces";
import { Zone } from "./Import";

const COLLECTIONS = "collections";
const IMAGES = "images";
const PAGE_NUMBER = "pageNumber";

type CollectionInfo = {
  name: string;
  zones: Array<Zone> | null;
  length: number;
  position: number;
};

type LocalStorageCollections = {
  [key: string]: CollectionInfo;
};

type DBImage = {
  filename: string;
  [PAGE_NUMBER]: number;
  imageData: ArrayBuffer;
};

function getLSAll(): LocalStorageCollections {
  return JSON.parse(localStorage.getItem(COLLECTIONS) ?? "{}");
}

function setLSAll(collections: LocalStorageCollections) {
  localStorage.setItem(COLLECTIONS, JSON.stringify(collections));
}

function getLSCollectionInfo(name: string): CollectionInfo | null {
  const ls = getLSAll();
  return ls[name];
}

function setLSCollectionInfo(name: string, collectionInfo: CollectionInfo) {
  const current = getLSAll();
  current[name] = collectionInfo;
  setLSAll(current);
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
