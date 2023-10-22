import { useRef, MouseEvent } from "react";
import styled from "styled-components";
import { Rectangle, Zones } from "../types/types";

function getMatrix(image: HTMLImageElement) {
  const matrix = new DOMMatrix();
  const elementCenter = new DOMPoint(
    image.clientWidth / 2,
    image.clientHeight / 2
  );
  const imageCenter = new DOMPoint(
    image.naturalWidth / 2,
    image.naturalHeight / 2
  );
  matrix.translateSelf(
    elementCenter.x - imageCenter.x,
    elementCenter.y - imageCenter.y
  );
  const zoom = Math.min(
    image.clientWidth / image.naturalWidth,
    image.clientHeight / image.naturalHeight
  );
  matrix.scaleSelf(zoom, zoom, 1, imageCenter.x, imageCenter.y);
  matrix.scaleSelf(image.naturalWidth, image.naturalHeight, 1, 0, 0);

  return matrix;
}

function ImportPreview({
  imageURL,
  zones,
  handleSetZone,
  ...rest
}: {
  imageURL: string;
  zones: Zones;
  handleSetZone: (newX: number, newY: number) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  function handleZoneClick(ev: MouseEvent) {
    ev.preventDefault();
    if (imgRef.current == null) return;

    const image = imgRef.current;
    const matrix = getMatrix(image);

    const point = new DOMPoint(
      ev.clientX - image.offsetLeft,
      ev.clientY - image.offsetTop
    );
    const translated = matrix.inverse().transformPoint(point);
    const [newX, newY] = [translated.x, translated.y].map((e) =>
      Math.min(Math.max(e, 0), 1)
    );

    handleSetZone(newX, newY);
  }

  function getZoneBoxStyle(
    rectangle: Rectangle,
    image: HTMLImageElement | null
  ) {
    if (rectangle.x1 == null || rectangle.y1 == null || image == null)
      return {};

    const matrix = getMatrix(image);
    const topLeft = matrix.transformPoint(
      new DOMPoint(rectangle.x1, rectangle.y1)
    );

    if (rectangle.x2 == null || rectangle.y2 == null) {
      return {
        left: topLeft.x + image.offsetLeft,
        top: topLeft.y + image.offsetTop,
        width: 0,
        height: 0,
      };
    }

    const bottomRight = matrix.transformPoint(
      new DOMPoint(rectangle.x2, rectangle.y2)
    );
    return {
      left: topLeft.x + image.offsetLeft,
      top: topLeft.y + image.offsetTop,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  return (
    <div {...rest}>
      <img
        src={imageURL}
        alt="Preview"
        style={{ opacity: imageURL === "" ? 0 : 1 }}
        onClick={handleZoneClick}
        ref={imgRef}
      />
      {imgRef.current != null &&
        zones.zones.map((zone) => {
          return (
            <div
              className="zone-box"
              key={zone.key}
              style={getZoneBoxStyle(zone.rectangle, imgRef.current)}
            />
          );
        })}{" "}
      {imgRef.current != null && zones.inProgressZone?.rectangle.x1 != null && (
        <div
          className="zone-box"
          key={`ipzb${zones.inProgressZone.key}`}
          style={getZoneBoxStyle(
            zones.inProgressZone.rectangle,
            imgRef.current
          )}
        />
      )}
    </div>
  );
}

export const StyledImportPreview = styled(ImportPreview)`
  border: 1px solid;
  width: 90%;
  height: 45%;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: #666666;
  }

  .zone-box {
    border: 2px solid;
    position: absolute;
    pointer-events: none;
  }
`;
