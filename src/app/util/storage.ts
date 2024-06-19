import { deleteIDB } from './indexedDB-storage';

export const REFRESH_MOD = 10;

export function getFileName(index: number, ext = 'png', indexBase = 1000000) {
  return `${indexBase + index + 1}.${ext}`;
}

export function deleteCollection(collectionName: string) {
  localStorage.removeItem(`${collectionName}-orig`);
  localStorage.removeItem(`${collectionName}-position`);
  deleteIDB(collectionName);
}
