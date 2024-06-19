export function deleteIDB(collectionName: string) {
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

const FILE_DATA = 'FILE_DATA';
const READONLY = 'readonly';
function getFileDataFromIDB_CB(
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
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          callback(cursor.value.contents as ArrayBuffer);
          cursor.continue();
        }
      }
    };
  };
}

export async function getFileDataFromIDB(
  dbName: string,
  file: string
): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    getFileDataFromIDB_CB(dbName, file, resolve);
  });
}
