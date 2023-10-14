import { useFilePicker } from "use-file-picker";
import styled from "styled-components";
import { FormEvent, MouseEvent, useRef, useState } from "react";
import { FileContent } from "use-file-picker/dist/interfaces";
import { storeCollection } from "../storage";
import { StyledNameInput } from "./ImportName";

export type Rectangle = {
  x1: number | null;
  x2: number | null;
  y1: number | null;
  y2: number | null;
};

export type Zone = {
  rectangle: Rectangle;
  key: number;
};

type Zones = {
  zones: Array<Zone>;
  inProgressZone: Zone | null;
};

function pc(n: number | null) {
  if (n == null) return "*";
  const formatter = new Intl.NumberFormat("en-US", { style: "percent" });
  return formatter.format(n).slice(0, -1);
}
function rectStr(rect: Rectangle) {
  return `<${pc(rect.x1)},${pc(rect.y1)}> - <${pc(rect.x2)},${pc(rect.y2)}>`;
}

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

function getZoneBoxStyle(rectangle: Rectangle, image: HTMLImageElement | null) {
  if (rectangle.x1 == null || rectangle.y1 == null || image == null) return {};

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

function Import({ ...rest }) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [selectedPreview, setSelected] = useState({ name: "", blobURL: "" });
  const [zones, setZones] = useState<Zones>({
    zones: [],
    inProgressZone: null,
  });
  // TODO handle loading state and errors
  const { openFilePicker, filesContent, loading, errors } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
  });

  function selectImage(file: FileContent<ArrayBuffer>) {
    // if (selected.blobURL) URL.revokeObjectURL(selected.blobURL); this is not safe to do here I think, leave this for later...
    const imageBlob = new Blob([file.content], { type: "image/*" });
    setSelected({
      name: file.name,
      blobURL: URL.createObjectURL(imageBlob),
    });
  }

  function addEmptyZone() {
    setZones((state) => {
      if (state.inProgressZone === null) {
        const newId = Math.max(...state.zones.map((e) => e.key), 0) + 1;
        return {
          ...state,
          inProgressZone: {
            rectangle: {
              x1: null,
              y1: null,
              x2: null,
              y2: null,
            },
            key: newId,
          },
        };
      } else return { ...state };
    });
  }

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

    setZones((state) => {
      if (state.inProgressZone == null) return state;
      if (
        state.inProgressZone.rectangle.x1 == null ||
        state.inProgressZone.rectangle.y1 == null
      ) {
        return {
          ...state,
          inProgressZone: {
            ...state.inProgressZone,
            rectangle: {
              ...state.inProgressZone.rectangle,
              x1: newX,
              y1: newY,
            },
          },
        };
      }

      return {
        zones: [
          ...state.zones,
          {
            ...state.inProgressZone,
            rectangle: {
              x1: Math.min(state.inProgressZone.rectangle.x1, newX),
              y1: Math.min(state.inProgressZone.rectangle.y1, newY),
              x2: Math.max(state.inProgressZone.rectangle.x1, newX),
              y2: Math.max(state.inProgressZone.rectangle.y1, newY),
            },
          },
        ],
        inProgressZone: null,
      };
    });
  }

  return (
    <div {...rest}>
      <div className="preview-pane">
        <div className="table-div">
          <table>
            <tbody>
              {filesContent.map((fileContent) => {
                return (
                  <tr
                    key={fileContent.name}
                    onClick={() => selectImage(fileContent)}
                  >
                    <td
                      className={
                        selectedPreview.name === fileContent.name
                          ? "selected"
                          : "not-selected"
                      }
                    >
                      {fileContent.name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <img
          src={selectedPreview.blobURL}
          alt="Preview"
          style={{ opacity: selectedPreview.blobURL === "" ? 0 : 1 }}
          onClick={handleZoneClick}
          ref={imgRef}
        />
      </div>
      <div className="controls-pane">
        <h1 onClick={openFilePicker}>Import images</h1>
        <StyledNameInput
          storeCollection={(collectionName) =>
            storeCollection(collectionName, filesContent, zones.zones)
          }
        />
        <div className="control-panel">
          <div>Zones:</div>
          {zones.zones.map((zone) => {
            return (
              <div className="zone-button" key={zone.key}>
                {rectStr(zone.rectangle)}
              </div>
            );
          })}
          {zones.inProgressZone && (
            <div className="zone-button" key={`ipz${zones.inProgressZone.key}`}>
              {rectStr(zones.inProgressZone.rectangle)}
            </div>
          )}
          {selectedPreview.name.length > 0 && !zones.inProgressZone && (
            <div className="zone-button" key="anz" onClick={addEmptyZone}>
              Add new zone
            </div>
          )}
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
          {imgRef.current != null &&
            zones.inProgressZone?.rectangle.x1 != null && (
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
      </div>
    </div>
  );
}

export const StyledImport = styled(Import)`
  display: flex;
  justify-content: center;

  .preview-pane {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;

    width: 40%;
    height: 100vh;
    border-left: 1px solid;
    border-right: 1px solid;
    margin: 0 1em;
    padding: 0 0.5em;
  }

  .controls-pane {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: left;

    width: 40%;
    height: 100vh;
    border-left: 1px solid;
    border-right: 1px solid;
    margin: 0 1em;
    padding: 0 0.5em;
  }

  h1 {
    width: 100%;
    text-align: center;
    border: 1px solid;
    background: #bbbbbb;
  }

  .table-div {
    border: 1px solid;
    overflow-y: auto;
    width: 90%;
    height: 45%;
    display: block;
  }

  table {
    width: 100%;
  }

  td {
    border: 1px solid;
    height: 0;
    width: 100%;
  }

  .selected {
    background-color: #666666;
    color: #f0f0f0;
    border-color: #000000;
  }

  img {
    border: 1px solid;
    width: 90%;
    height: 45%;
    object-fit: contain;
    background-color: #666666;
  }

  .control-panel {
    border: 1px solid;
    padding: 0.5em;
    margin: 1em 0 0 0;

    .zone-button {
      border: 1px solid;
      background: #bbbbbb;
      padding: 0.2em;
      margin: 0.5em 0 0 0;
    }

    .zone-box {
      border: 2px solid;
      position: absolute;
      pointer-events: none;
    }
  }
`;
