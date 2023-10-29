import { useFilePicker } from "use-file-picker";
import { FileContent } from "use-file-picker/types";
import styled from "styled-components";
import { useState } from "react";
import { storeCollection } from "../storage";
import { StyledNameInput } from "./ImportName";
import { StyledFileList } from "./ImportFileList";
import { StyledImportPreview } from "./ImportPreview";
import { StyledZoneControl } from "./ImportZoneControl";
import { CompleteZone, Zones } from "../types";

function constrainCoordinates(zone: CompleteZone): CompleteZone {
  return {
    ...zone,
    rectangle: {
      x1: Math.min(zone.rectangle.x1, zone.rectangle.x2),
      y1: Math.min(zone.rectangle.y1, zone.rectangle.y2),
      x2: Math.max(zone.rectangle.x1, zone.rectangle.x2),
      y2: Math.max(zone.rectangle.y1, zone.rectangle.y2),
    },
  };
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

  function handleSetZone(targetZone: CompleteZone) {
    if (targetZone.key == -1) {
      setZones((state) => {
        return {
          zones: state.zones,
          inProgressZone: {
            ...targetZone,
            key: state.inProgressZone?.key ?? -1,
          },
        };
      });
    } else {
      targetZone = constrainCoordinates(targetZone);
      setZones((state) => {
        const index = state.zones.findIndex((zone) => zone.key === zone.key);
        if (index === -1) {
          return state;
        }
        return {
          zones: [
            ...state.zones.slice(0, index),
            targetZone,
            ...state.zones.slice(index + 1),
          ],
          inProgressZone: state.inProgressZone,
        };
      });
    }
  }

  function handleMoveZone(key: number, newX: number, newY: number) {
    setZones((state) => {
      const index = state.zones.findIndex((zone) => zone.key === key);
      if (index === -1) {
        return state;
      }
      const width =
        state.zones[index].rectangle.x2 - state.zones[index].rectangle.x1;
      const height =
        state.zones[index].rectangle.y2 - state.zones[index].rectangle.y1;
      return {
        zones: [
          ...state.zones.slice(0, index),
          {
            key: state.zones[index].key,
            rectangle: {
              // Math min/max to avoid out of bounds
              x1: newX,
              y1: newY,
              x2: newX + width,
              y2: newY + height,
            },
          },
          ...state.zones.slice(index + 1),
        ],
        inProgressZone: state.inProgressZone,
      };
    });
  }

  function handleCommitZone() {
    setZones((state) => {
      if (
        !state.inProgressZone ||
        Object.entries(state.inProgressZone.rectangle).some((e) => !e[1])
      )
        return state;

      return {
        zones: [
          ...state.zones,
          constrainCoordinates(state.inProgressZone as CompleteZone),
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
          handleCommitZone={handleCommitZone}
          handleMoveZone={handleMoveZone}
        />
      </div>
      <div className="controls-pane">
        <h1 onClick={openFilePicker}>Import images</h1>
        <StyledNameInput
          storeCollection={(collectionName) =>
            storeCollection(collectionName, filesContent, zones.zones)
          }
        />
        <StyledZoneControl
          previewAvailable={selectedPreview.name.length > 0}
          zones={zones}
          addEmptyZone={addEmptyZone}
        />
      </div>
    </div>
  );
}

const StyledImport = styled(Import)`
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
`;

export default StyledImport;
