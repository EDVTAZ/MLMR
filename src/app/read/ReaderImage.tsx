/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getLSCollectionInfo,
  getPageData,
  setCurrentPage,
} from "../../storage";
import styled from "styled-components";
import {
  CollectionInfo,
  CompleteRectangle,
  CompleteZone,
  ReaderPosition,
  Zones,
} from "../../types";

const PLACEHOLDER_IMG_SRC = "next.svg";

function ReaderImage({
  collectionName,
  zones,
  position,
  zoom,
  visible,
  ...rest
}: {
  collectionName: string;
  zones: CompleteZone[];
  position: ReaderPosition;
  zoom: number;
  visible: boolean;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [blobURLs, setBlobURLs] = useState<Array<string>>([]);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [imageStyle, setImageStyle] = useState({});

  const zoneCount = zones.length === 0 ? 1 : zones.length;
  const page = Math.floor(position.count / zoneCount);
  const currentImgSrc = blobURLs[page] ?? PLACEHOLDER_IMG_SRC;

  const [collectionInfo, _] = useState(
    getLSCollectionInfo(collectionName) as CollectionInfo
  ); // TODO

  useEffect(() => {
    const min = Math.max(page - 10, 0);
    const max = Math.min(page + 10, collectionInfo.length);

    getPageData(collectionName, min, max - min, (images) => {
      setBlobURLs((oldBlobURLs) => {
        const newBlobURLs = [];
        for (let i = min; i < max; i++) {
          newBlobURLs[i] =
            oldBlobURLs[i] ??
            URL.createObjectURL(
              new Blob([images[i].imageData], { type: "image/*" })
            );
        }
        for (const index in oldBlobURLs) {
          if (!newBlobURLs[index]) URL.revokeObjectURL(oldBlobURLs[index]);
        }
        return newBlobURLs;
      });
    });
  }, [page, collectionInfo.length, collectionName]);

  useLayoutEffect(() => {
    const currentZone: CompleteRectangle = (zones[position.count % zoneCount]
      ?.rectangle as CompleteRectangle) ?? { x1: 0, y1: 0, x2: 1, y2: 1 };

    const widthPercent = currentZone.x2 - currentZone.x1;
    const heightPercent = currentZone.y2 - currentZone.y1;

    const sizeRatio =
      (window.innerWidth * zoom) / (imgNaturalSize.width * widthPercent);

    setImageStyle({
      height: `${heightPercent * imgNaturalSize.height}px`,
      width: `${widthPercent * imgNaturalSize.width}px`,
      //transform: `scale(${sizeRatio})`,
      transform: `scale(${sizeRatio}) translate(-${
        currentZone.x1 * imgNaturalSize.width
      }px, -${currentZone.y1 * imgNaturalSize.height}px)`,
      left: `${50 - zoom * 50}vw`,
      /*objectPosition: `left -${currentZone.x1 * imgNaturalSize.width}px top -${
        currentZone.y1 * imgNaturalSize.height
      }px`,*/
    });
  }, [imgNaturalSize, position, zoom, collectionInfo, zones, zoneCount]);

  useLayoutEffect(() => {
    setCurrentPage(collectionName, position.count);
    imgRef.current?.scrollIntoView({
      block: position.scroll,
      inline: "center",
      behavior: "instant",
    });
  }, [position, collectionName]);

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
  object-fit: cover;
  transform-origin: top left;
`;
