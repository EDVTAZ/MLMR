import { useFilePicker } from "use-file-picker";
import styled from "styled-components";
import { useState } from "react";
import { FileContent } from "use-file-picker/dist/interfaces";
import { storeCollection } from "../storage";
import { StyledNameInput } from "./ImportName";
import { StyledFileList } from "./ImportFileList";
import { StyledImportPreview } from "./ImportPreview";

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

export type Zones = {
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

function Import({ ...rest }) {
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

  function handleSetZone(newX: number, newY: number) {
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
        <StyledFileList
          filesContent={filesContent}
          selectedPreview={selectedPreview}
          selectImage={selectImage}
        />
        <StyledImportPreview
          imageURL={selectedPreview.blobURL}
          zones={zones}
          handleSetZone={handleSetZone}
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
  }
`;
