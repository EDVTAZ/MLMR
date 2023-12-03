import { getPageData } from "@/storage";
import { pages } from "next/dist/build/templates/app-page";
import { useEffect, useState } from "react";

const CACHE_SIZE = 10;

export function useImagesFromDB(
  collectionName: string,
  currentPage: number
): { [key: number]: string } {
  const [blobURLs, setBlobURLs] = useState<{ [key: number]: string }>({});
  const startPage = Math.max(0, currentPage - CACHE_SIZE / 2);

  useEffect(() => {
    setBlobURLs({});
  }, [collectionName]);

  useEffect(() => {
    getPageData(collectionName, startPage, CACHE_SIZE, (images) => {
      setBlobURLs((oldBlobURLs) => {
        const newBlobURLs = Object.fromEntries(
          Object.entries(oldBlobURLs).filter(
            ([index, url]) =>
              parseInt(index) >= startPage &&
              parseInt(index) < startPage + CACHE_SIZE
          )
        );

        for (const index in oldBlobURLs) {
          if (!newBlobURLs[index]) URL.revokeObjectURL(oldBlobURLs[index]);
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
  }, [collectionName, startPage]);

  return blobURLs;
}
