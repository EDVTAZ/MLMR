/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  useLayoutEffect(() => {
    containerRef.current?.scrollIntoView({
      block: position.scroll,
      inline: "center",
      behavior: "instant",
    });
  }, [position.scroll]);

  return (
    <div ref={containerRef} {...rest}>
      <Images
        images={images}
        dimensions={{ width: windowWidth * zoom }}
      ></Images>
    </div>
  );
}

export const StyledReaderImage = styled(ReaderImage)`
  display: flex;
  justify-content: center;
`;
