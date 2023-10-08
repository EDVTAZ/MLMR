import { useFilePicker } from "use-file-picker";
import styled from "styled-components";
import { FormEvent, MouseEvent, useRef, useState } from "react";
import { FileContent } from "use-file-picker/dist/interfaces";

type Rectangle = {
  x1: number | null;
  x2: number | null;
  y1: number | null;
  y2: number | null;
};

type Zone = {
  rectangle: Rectangle;
  key: number;
};

type Zones = {
  zones: Array<Zone>;
  inProgressZone: Zone | null;
};

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

  function handleSubmit(ev: FormEvent) {
    // TODO
    ev.preventDefault();
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

    const point = new DOMPoint(
      ev.clientX - image.offsetLeft,
      ev.clientY - image.offsetTop
    );
    const translated = matrix.inverse().transformPoint(point);
    const [newX, newY] = [translated.x, translated.y].map((e) =>
      Math.floor(e * 100)
    );

    setZones((state) => {
      if (state.inProgressZone == null) return state;
      if (state.inProgressZone.rectangle.x1 == null) {
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
              ...state.inProgressZone.rectangle,
              x2: newX,
              y2: newY,
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
        <div className="control-panel">
          <label htmlFor="collection-name">Collection Name:</label>
          <form onSubmit={handleSubmit}>
            <input id="collection-name" name="collectionName" />
            <button type="submit">Save images</button>
          </form>
        </div>

        <div className="control-panel">
          {zones.zones.map((zone) => {
            return (
              <div
                className="control-panel"
                key={zone.key}
              >{`<${zone.rectangle.x1},${zone.rectangle.y1}> - <${zone.rectangle.x2},${zone.rectangle.y2}>`}</div>
            );
          })}
          {zones.inProgressZone && (
            <div
              className="control-panel"
              key={`ipz${zones.inProgressZone.key}`}
            >{`<${zones.inProgressZone.rectangle.x1},${zones.inProgressZone.rectangle.y1}> - <${zones.inProgressZone.rectangle.x2},${zones.inProgressZone.rectangle.y2}>`}</div>
          )}
          {selectedPreview.name.length > 0 && !zones.inProgressZone && (
            <div className="control-panel" key="anz" onClick={addEmptyZone}>
              Add new zone
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default styled(Import)`
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

    form {
      display: flex;
      align-items: center;
      input {
        flex: 1 1 auto;
        margin: 0 0.5em 0 0;
        border: 1px solid;
      }
      button {
        border: 1px solid;
        background: #bbbbbb;
      }
    }
  }
`;
