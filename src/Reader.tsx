import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  CollectionInfo,
  getLSCollectionInfo,
  getPageData,
  setCurrentPage,
} from "./storage";

type CompleteRectangle = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

const PLACEHOLDER_IMG_SRC = "logo512.png";

function Reader({ collectionNames, ...rest }: { collectionNames: string[] }) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [position, setPosition] = useState(0);
  const [blobURLs, setBlobURLs] = useState<Array<string>>([]);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [imageStyle, setImageStyle] = useState({});

  const [collectionInfo, _] = useState(
    getLSCollectionInfo(collectionNames[0]) as CollectionInfo
  ); // TODO
  const zoneCount =
    collectionInfo.zones.length === 0 ? 1 : collectionInfo.zones.length;
  const page = Math.floor(position / zoneCount);
  const currentImgSrc = blobURLs[page] ?? PLACEHOLDER_IMG_SRC;

  function step(count: number) {
    setPosition((prev) => {
      const newVal = Math.min(
        Math.max(prev + count, 0),
        zoneCount * collectionInfo.length - 1
      );
      setCurrentPage(collectionNames[0], newVal);
      return newVal;
    });
  }

  useEffect(() => {
    const min = Math.max(page - 10, 0);
    const max = Math.min(page + 10, collectionInfo.length);

    getPageData(collectionNames[0], min, max - min, (images) => {
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
  }, [page, collectionInfo.length, collectionNames]);

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
    <div {...rest}>
      <img
        className="img-display img-1"
        ref={imgRef}
        style={imageStyle}
        src={currentImgSrc}
        onLoad={() =>
          setImgNaturalSize({
            width: imgRef.current?.naturalWidth ?? 0,
            height: imgRef.current?.naturalHeight ?? 0,
          })
        }
        alt="page"
      />

      <div className="base-navigation">
        <button className="side-navigation" onClick={() => step(1)} />
        <button className="side-navigation" onClick={() => step(-1)} />
      </div>
    </div>
  );
}
export const StyledReader = styled(Reader)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  .img-display {
    margin: auto;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
    transform-origin: top left;
  }

  .base-navigation {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
  }

  .side-navigation {
    height: 100%;
    width: 50%;
    background-color: transparent;
    border: 0;
  }
`;
