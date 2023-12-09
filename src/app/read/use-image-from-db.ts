import { difference } from "@/ImageComposite/setOperations";
import { getPageData } from "@/storage";
import { useEffect, useState } from "react";

const CACHE_SIZE = 20;

export function useImagesFromDB(
  collectionName: string,
  currentPage: number
): { [key: number]: string } {
  const [blobURLs, setBlobURLs] = useState<{ [key: number]: string }>({});
  const startPage = Math.max(
    0,
    currentPage -
      Math.floor(CACHE_SIZE / 2) -
      (currentPage % Math.floor(CACHE_SIZE / 4))
  );

  useEffect(() => {
    setBlobURLs({});
  }, [collectionName]);

  useEffect(() => {
    // todo cancel previous request? or just move to redux rtk or sthng
    const currentlyAvailable = Object.keys(blobURLs).map((e) => parseInt(e));
    const newRange = Array.from(Array(CACHE_SIZE).keys(), (v) => v + startPage);
    const needed = difference(newRange, currentlyAvailable);
    const neededStart = Math.min(...needed);
    const neededLength = Math.max(...needed) - neededStart + 1;

    if (needed.length > 0) {
      getPageData(collectionName, neededStart, neededLength, (images) => {
        setBlobURLs((oldBlobURLs) => {
          const newBlobURLs = Object.fromEntries(
            Object.entries(oldBlobURLs).filter(
              ([index, url]) =>
                parseInt(index) >= startPage &&
                parseInt(index) < startPage + CACHE_SIZE
            )
          );

          for (const index in oldBlobURLs) {
            if (!newBlobURLs[index]) {
              URL.revokeObjectURL(oldBlobURLs[index]);
            }
          }

          for (let i = startPage; i < startPage + CACHE_SIZE; i++) {
            if (images[i] && !newBlobURLs[i]) {
              newBlobURLs[i] = URL.createObjectURL(
                new Blob([images[i].imageData], { type: "image/*" })
              );
            }
          }

          return newBlobURLs;
        });
      });
    }
  }, [blobURLs, collectionName, startPage]);

  return blobURLs;
}
