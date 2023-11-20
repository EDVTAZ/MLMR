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
import { Stage, Layer, Image } from "react-konva";
import useImage from "use-image";

const PLACEHOLDER_IMG_SRC = "next.svg";

function heightFromWidth(
  windowWidth: number,
  zoom: number,
  naturalHeight: number,
  naturalWidth: number,
  rectangle: CompleteRectangle
): number {
  return (
    (windowWidth * zoom * naturalHeight * (rectangle.y2 - rectangle.y1)) /
    (naturalWidth * (rectangle.x2 - rectangle.x1))
  );
}

function ReaderImage({
  collectionNames,
  zoness,
  position,
  zoom,
  version,
  ...rest
}: {
  collectionNames: [string, string];
  zoness: [CompleteZone[], CompleteZone[]];
  position: ReaderPosition;
  zoom: number;
  version: number;
}) {
  const [windowWidth, setWindowWidth] = useState(0);
  useLayoutEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const zoneCounts = zoness.map((zones) =>
    zones.length === 0 ? 1 : zones.length
  );
  const pages = zoneCounts.map((zoneCount) =>
    Math.floor(position.count / zoneCount)
  );

  const [blobURLs, setBlobURLs] = useState<[string, string]>([
    PLACEHOLDER_IMG_SRC,
    PLACEHOLDER_IMG_SRC,
  ]);
  const [image0, imageLoadState0] = useImage(blobURLs[0]);
  const [image1, imageLoadState1] = useImage(blobURLs[1]);

  const [collectionInfo0, _0] = useState(
    getLSCollectionInfo(collectionNames[0]) as CollectionInfo
  ); // TODO

  const [collectionInfo1, _1] = useState(
    getLSCollectionInfo(collectionNames[1]) as CollectionInfo
  ); // TODO

  useEffect(() => {
    for (let i = 0; i < 2; i++) {
      getPageData(collectionNames[i], pages[i], 1, (images) => {
        setBlobURLs((oldBlobURLs) => {
          const newBlobURLs = [...oldBlobURLs] as [string, string];
          newBlobURLs[i] = URL.createObjectURL(
            new Blob([images[pages[i]].imageData], { type: "image/*" })
          );

          for (const index in oldBlobURLs) {
            if (!newBlobURLs[index]) URL.revokeObjectURL(oldBlobURLs[index]);
          }
          return newBlobURLs;
        });
      });
    }
  }, [pages[0], pages[1], collectionNames[0], collectionNames[1]]);

  /* useLayoutEffect(() => {
    setCurrentPage(collectionName, position.count);
    imgRef.current?.scrollIntoView({
      block: position.scroll,
      inline: "center",
      behavior: "instant",
    });
  }, [position, collectionName]);*/

  if (imageLoadState0 != "loaded" || imageLoadState1 != "loaded") {
    return <div {...rest}>huh?</div>;
  }

  const naturalWidth0 = (image0 as HTMLImageElement).naturalWidth;
  const naturalWidth1 = (image1 as HTMLImageElement).naturalWidth;
  const naturalHeight0 = (image0 as HTMLImageElement).naturalHeight;
  const naturalHeight1 = (image1 as HTMLImageElement).naturalHeight;
  const rectangle0 = zoness[0][position.count % zoneCounts[0]].rectangle;
  const rectangle1 = zoness[1][position.count % zoneCounts[1]].rectangle;

  const height0 = heightFromWidth(
    windowWidth,
    zoom,
    naturalHeight0,
    naturalWidth0,
    rectangle0
  );
  const height1 = heightFromWidth(
    windowWidth,
    zoom,
    naturalHeight1,
    naturalWidth1,
    rectangle1
  );

  const transformedWidth0 =
    (windowWidth * zoom) / (rectangle0.x2 - rectangle0.x1);
  const transformedWidth1 =
    (windowWidth * zoom) / (rectangle1.x2 - rectangle1.x1);

  const transformedHeight0 = height0 / (rectangle0.y2 - rectangle0.y1);
  const transformedHeight1 = height1 / (rectangle1.y2 - rectangle1.y1);

  return (
    imageLoadState0 === "loaded" &&
    imageLoadState1 === "loaded" && (
      <Stage
        width={windowWidth * zoom}
        height={Math.max(height0, height1)}
        {...rest}
      >
        <Layer>
          <Image
            image={image0}
            width={transformedWidth0}
            height={transformedHeight0}
            x={-transformedWidth0 * rectangle0.x1}
            y={-transformedHeight0 * rectangle0.y1}
            key="0"
            alt="0"
            opacity={version === 1 ? 1 : 0}
          ></Image>

          <Image
            image={image1}
            width={transformedWidth1}
            height={transformedHeight1}
            x={-transformedWidth1 * rectangle1.x1}
            y={-transformedHeight1 * rectangle1.y1}
            key="1"
            alt="1"
            opacity={version === -1 ? 1 : 0}
          ></Image>
        </Layer>
      </Stage>
    )
  );
}

export const StyledReaderImage = styled(ReaderImage)`
  margin: auto;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
`;
