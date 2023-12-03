/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect, useState } from "react";
import styled from "styled-components";
import { CompleteZone, ReaderPosition } from "../../types";
import { useImagesFromDB } from "./use-image-from-db";
import { generateURLsToLoad, getDisplayImageID } from "./misc";
import { Images } from "@/ImageComposite/Images";

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

  const pages = zoness.map((zones) =>
    Math.floor(position.count / zones.length)
  ) as [number, number];

  const blobURLss = [
    useImagesFromDB(collectionNames[0], pages[0]),
    useImagesFromDB(collectionNames[1], pages[1]),
  ];

  const images = {
    ...generateURLsToLoad(blobURLss[0], zoness[0]),
    ...generateURLsToLoad(blobURLss[1], zoness[1]),
  };

  const currentlyShown = getDisplayImageID(
    pages[version],
    blobURLss[version][pages[version]],
    zoness[version][position.count % zoness[version].length]
  );
  for (const idx in images) {
    if (images[idx].id == currentlyShown) images[idx].transparency = 0;
  }

  /* useLayoutEffect(() => {
    setCurrentPage(collectionName, position.count);
    imgRef.current?.scrollIntoView({
      block: position.scroll,
      inline: "center",
      behavior: "instant",
    });
  }, [position, collectionName]);*/

  return (
    <Images
      images={images}
      dimensions={{ width: windowWidth }}
      {...rest}
    ></Images>
  );
}

export const StyledReaderImage = styled(ReaderImage)`
  margin: auto;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
`;
