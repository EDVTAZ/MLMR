import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CollectionInfo, getLSCollectionInfo, getPageData } from "./storage";
import styled from "styled-components";

type CompleteRectangle = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

const PLACEHOLDER_IMG_SRC = "logo512.png";

function ReaderImage({
  collectionName,
  position,
  visible,
  ...rest
}: {
  collectionName: string;
  position: number;
  visible: boolean;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [blobURLs, setBlobURLs] = useState<Array<string>>([]);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [imageStyle, setImageStyle] = useState({});

  const [collectionInfo, _] = useState(
    getLSCollectionInfo(collectionName) as CollectionInfo
  ); // TODO
  const zoneCount =
    collectionInfo.zones.length === 0 ? 1 : collectionInfo.zones.length;
  const page = Math.floor(position / zoneCount);
  const currentImgSrc = blobURLs[page] ?? PLACEHOLDER_IMG_SRC;

  useEffect(() => {
    const min = Math.max(page - 10, 0);
    const max = Math.min(page + 10, collectionInfo.length);

    getPageData(collectionName, min, max - min, (images) => {
      setBlobURLs((oldBlobURLs) => {
        const newBlobURLs = [];
        for (let i = min; i < max; i++) {
          newBlobURLs[i] =
            oldBlobURLs[i] ??
            URL.createObjectURL(new Blob([images[i]], { type: "image/*" }));
        }
        for (const index in oldBlobURLs) {
          if (!newBlobURLs[index]) URL.revokeObjectURL(oldBlobURLs[index]);
        }
        return newBlobURLs;
      });
    });
  }, [page, collectionInfo.length, collectionName]);

  useLayoutEffect(() => {
    const currentZone: CompleteRectangle = (collectionInfo.zones[
      position % collectionInfo.zones.length
    ].rectangle as CompleteRectangle) ?? { x1: 0, y1: 0, x2: 1, y2: 1 };

    const widthPercent = currentZone.x2 - currentZone.x1;
    const heightPercent = currentZone.y2 - currentZone.y1;

    const sizeRatio = window.innerWidth / (imgNaturalSize.width * widthPercent);

    setImageStyle({
      height: `${heightPercent * imgNaturalSize.height}px`,
      width: `${widthPercent * imgNaturalSize.width}px`,
      transform: `scale(${sizeRatio})`,
      objectPosition: `left -${currentZone.x1 * imgNaturalSize.width}px top -${
        currentZone.y1 * imgNaturalSize.height
      }px`,
    });
  }, [
    imgNaturalSize /*window.innerWidth, TODO listen for change event*/,
    position,
    collectionInfo,
  ]);

  return (
    <img
      className="img-display"
      ref={imgRef}
      style={{ ...imageStyle, opacity: visible ? 1 : 0 }}
      src={currentImgSrc}
      onLoad={() =>
        setImgNaturalSize({
          width: imgRef.current?.naturalWidth ?? 0,
          height: imgRef.current?.naturalHeight ?? 0,
        })
      }
      alt="page"
      {...rest}
    />
  );
}

export const StyledReaderImage = styled(ReaderImage)`
  margin: auto;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  object-fit: cover;
  transform-origin: top left;
`;
