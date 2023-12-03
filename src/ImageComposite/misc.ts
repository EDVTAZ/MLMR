import { CompleteRectangle } from "@/types";
import {
  DisplayImage,
  ImageResults,
  CanvasPosition,
  CompleteDimensions,
} from "./types";

export function getDisplayImageID(img: DisplayImage): string {
  return `${img.id}-${img.url}-${Object.values(img.position).join("/")}`;
}

export function getVisibleImages(
  images: DisplayImage[],
  imageElements: ImageResults
): number[] {
  return images
    .filter(
      (val) => val.transparency < 1 && imageElements[val.id].state == "loaded"
    )
    .map((val) => val.id);
}

export function getHeightFromWidth(
  width: number,
  zoneRect: CompleteRectangle,
  image: HTMLImageElement
): number {
  return (
    (width * image.naturalHeight * (zoneRect.y2 - zoneRect.y1)) /
    (image.naturalWidth * (zoneRect.x2 - zoneRect.x1))
  );
}

export function getImagePosition(
  stageDimensions: CompleteDimensions,
  zoneRect: CompleteRectangle,
  image: HTMLImageElement
): CanvasPosition {
  const zoneRectPixels: CompleteRectangle = {
    x1: zoneRect.x1 * image.naturalWidth,
    x2: zoneRect.x2 * image.naturalWidth,
    y1: zoneRect.y1 * image.naturalHeight,
    y2: zoneRect.y2 * image.naturalHeight,
  };
  const scale = stageDimensions.width / (zoneRectPixels.x2 - zoneRectPixels.x1);
  const zoneRectScaled: CompleteRectangle = {
    x1: zoneRectPixels.x1 * scale,
    x2: zoneRectPixels.x2 * scale,
    y1: zoneRectPixels.y1 * scale,
    y2: zoneRectPixels.y2 * scale,
  };

  return {
    x: zoneRectScaled.x1,
    y: zoneRectScaled.y1,
    width: zoneRectScaled.x2 - zoneRectScaled.x1,
    height: zoneRectScaled.y2 - zoneRectScaled.y1,
  };
}
