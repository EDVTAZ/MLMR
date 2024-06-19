import { useEffect, useState } from 'react';
import { getFileDataFromIDB } from './indexedDB-storage';
import { REFRESH_MOD, getFileName } from './storage';

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

    const timeoutID = setTimeout(() => {
      getFileDataFromIDB(
        `/idbfs/${collectionName}`,
        `${type}/${getFileName(index, 'png')}`
      ).then((imageData) => {
        setBlobURL((oldBlobURL) => {
          URL.revokeObjectURL(oldBlobURL);
          return URL.createObjectURL(
            new Blob([imageData], { type: 'image/*' })
          );
        });
      });
    }, 200);

    return () => {
      clearTimeout(timeoutID);
      setBlobURL((oldBlobURL) => {
        URL.revokeObjectURL(oldBlobURL);
        return '';
      });
    };
  }, [collectionName, index, type, cacheV, shouldLoad]);

  return { blobURL, refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD) };
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
      `${type}/${getFileName(index, 'txt')}`
    ).then((data) => {
      const dataString = new TextDecoder('utf-8').decode(data);
      const [width, height] = dataString.split(':').map((i) => parseInt(i));
      setRatio(width / height);
    });
  }, [collectionName, index, type, cacheV]);

  return { ratio, refresh: () => setCacheV((v) => (v + 1) % REFRESH_MOD) };
}
