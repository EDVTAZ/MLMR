import { Layer, Stage, Image } from "react-konva";
import {
  CompleteDimensions,
  DisplayImage,
  HeightOpenDimensions,
} from "./types";
import { useImages } from "./use-images";
import { useEffect, useLayoutEffect, useState } from "react";
import { getVisibleImages, getHeightFromWidth, getImagePosition } from "./misc";

// TODO - implement margins - implement fixed height/width

export function Images({
  images,
  dimensions,
}: {
  images: { [key: string]: DisplayImage };
  dimensions: HeightOpenDimensions;
}) {
  const [calculatedDimensions, setDimensions] = useState<CompleteDimensions>({
    width: dimensions.width,
    height: dimensions.width,
  });

  const imageElements = useImages(
    Object.fromEntries(
      Object.entries(images).map(([idx, val]) => [val.id, val.url])
    )
  );

  useLayoutEffect(() => {
    const calculatedHeight = Math.max(
      0,
      ...getVisibleImages(images, imageElements).map((id) => {
        return getHeightFromWidth(
          dimensions.width,
          images[id].position,
          imageElements[id].element as HTMLImageElement
        );
      })
    );
    setDimensions({
      width: dimensions.width,
      height: calculatedHeight,
    });
    if (dimensions.setHeight) dimensions.setHeight(calculatedHeight);
  }, [imageElements, images, dimensions]);

  useLayoutEffect(() => {
    getVisibleImages(images, imageElements).map((id) => {
      console.log(
        id,
        getImagePosition(
          calculatedDimensions,
          images[id].position,
          imageElements[id].element as HTMLImageElement
        )
      );
    });
  });

  return (
    <Stage
      width={calculatedDimensions.width}
      height={calculatedDimensions.height}
    >
      <Layer>
        {getVisibleImages(images, imageElements).map((id) => {
          return (
            <Image
              image={imageElements[id].element}
              opacity={1 - images[id].transparency}
              {...getImagePosition(
                calculatedDimensions,
                images[id].position,
                imageElements[id].element as HTMLImageElement
              )}
              key={id}
              alt={id}
            ></Image>
          );
        })}
      </Layer>
    </Stage>
  );
}
