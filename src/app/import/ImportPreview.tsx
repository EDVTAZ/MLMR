/* eslint-disable @next/next/no-img-element */
import { useRef, MouseEvent, useState } from "react";
import styled from "styled-components";
import { CompleteRectangle, CompleteZone, Rectangle, Zones } from "../types";
import { Layer, Rect, Stage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";

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

function getZoneBoxCoordinates(
  rectangle: Rectangle,
  image: HTMLImageElement | null
) {
  if (rectangle.x1 == null || rectangle.y1 == null || image == null) return {};

  const matrix = getMatrix(image);
  const topLeft = matrix.transformPoint(
    new DOMPoint(rectangle.x1, rectangle.y1)
  );

  if (rectangle.x2 == null || rectangle.y2 == null) {
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: 0,
      height: 0,
    };
  }

  const bottomRight = matrix.transformPoint(
    new DOMPoint(rectangle.x2, rectangle.y2)
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

function ImportPreview({
  imageURL,
  zones,
  handleSetZone,
  handleCommitZone,
  selectedZone,
  ...rest
}: {
  imageURL: string;
  zones: Zones;
  handleSetZone: (zone: CompleteZone) => void;
  handleCommitZone: () => void;
  selectedZone: number | null;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState<any>(null);

  function translateClickCoordinates(x: number, y: number) {
    if (imgRef.current == null) throw new Error("imgRef not defined");

    const image = imgRef.current;
    const matrix = getMatrix(image);

    const point = new DOMPoint(x - image.offsetLeft, y - image.offsetTop);
    const translated = matrix.inverse().transformPoint(point);
    const [newX, newY] = [translated.x, translated.y].map((e) =>
      Math.min(Math.max(e, 0), 1)
    );

    return [newX, newY];
  }

  function handleMouseDown(
    konvaEvent: KonvaEventObject<globalThis.MouseEvent>
  ) {
    if (imgRef.current == null) return;

    const [newX, newY] = translateClickCoordinates(
      konvaEvent.evt.clientX,
      konvaEvent.evt.clientY
    );

    if (zones.inProgressZone != null) {
      handleSetZone({
        rectangle: { x1: newX, x2: newX, y1: newY, y2: newY },
        key: -1,
      });
    }

    if (selectedZone != null) {
      const zone = zones.zones.find((e) => e.key === selectedZone);
      if (!zone) return;
      const sides = [];
      if (zone.rectangle.x1 > newX) sides.push("x1");
      if (zone.rectangle.y1 > newY) sides.push("y1");
      if (zone.rectangle.x2 < newX) sides.push("x2");
      if (zone.rectangle.y2 < newY) sides.push("y2");
      if (sides.length == 0) sides.push("x1", "x2", "y1", "y2");
      setDragging({ sides, x: newX, y: newY, original: zone });
    }
  }

  function handleMouseUp(konvaEvent: KonvaEventObject<globalThis.MouseEvent>) {
    handleCommitZone();
    setDragging(null);
  }

  function handleMouseMove(
    konvaEvent: KonvaEventObject<globalThis.MouseEvent>
  ) {
    if (imgRef.current == null) return;

    const [newX, newY] = translateClickCoordinates(
      konvaEvent.evt.clientX,
      konvaEvent.evt.clientY
    );

    if (
      zones.inProgressZone != null &&
      zones.inProgressZone.rectangle.x1 != null &&
      zones.inProgressZone.rectangle.y1 != null
    ) {
      handleSetZone({
        rectangle: {
          x1: zones.inProgressZone.rectangle.x1,
          y1: zones.inProgressZone.rectangle.y1,
          x2: newX,
          y2: newY,
        },
        key: -1,
      });
    }

    if (dragging !== null && selectedZone !== null) {
      const offset = { x: newX - dragging.x, y: newY - dragging.y };
      const newRect = { ...dragging.original.rectangle };
      dragging.sides.forEach((i: string) => {
        //@ts-ignore
        newRect[i] += offset[i[0]];
      });
      handleSetZone({
        rectangle: newRect,
        key: selectedZone,
      });
    }
  }

  return (
    <div {...rest}>
      <img
        src={imageURL}
        alt="Preview"
        style={{ opacity: imageURL === "" ? 0 : 1 }}
        ref={imgRef}
      />
      {imgRef.current != null && (
        <Stage
          width={imgRef.current.clientWidth}
          height={imgRef.current.clientHeight}
          style={{
            position: "absolute",
            left: imgRef.current.offsetLeft,
            top: imgRef.current.offsetTop,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {zones.zones.map((zone) => {
              return (
                <Rect
                  key={zone.key}
                  stroke={zone.key === selectedZone ? "blue" : "black"}
                  {...getZoneBoxCoordinates(zone.rectangle, imgRef.current)}
                />
              );
            })}
            {zones.inProgressZone?.rectangle.x1 != null && (
              <Rect
                key={`ipzb${zones.inProgressZone.key}`}
                stroke={"black"}
                {...getZoneBoxCoordinates(
                  zones.inProgressZone.rectangle,
                  imgRef.current
                )}
              />
            )}
          </Layer>
        </Stage>
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
`;
