import styled from "styled-components";
import { useEffect, useState } from "react";
import { getLSCollectionsAll, getPageData } from "../../storage";
import { StyledFileList } from "./ImportFileList";
import { StyledImportPreview } from "./ImportPreview";
import { StyledZoneControl } from "./ImportZoneControl";
import { CompleteZone, DBImage, Zones } from "../../types";
import { ColumnLayout } from "@/styled-components/ColumnLayout";
import { RowFlexLayout, RowLayout } from "@/styled-components/RowLayout";
import { BoxContainer } from "@/styled-components/Container";

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
  const [collectionName, setCollectionName] = useState("");
  const [collections, setCollections] = useState(getLSCollectionsAll());
  const [filesContent, setFilesContent] = useState<DBImage[]>([]);
  const [selectedPreview, setSelectedPreview] = useState({
    name: "",
    blobURL: "",
  });
  const [zones, setZones] = useState<Zones>({
    zones: [],
    inProgressZone: null,
  });
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  useEffect(() => {
    if (collectionName != "") {
      getPageData(
        collectionName,
        0,
        collections[collectionName].length,
        setFilesContent
      );
    }
  }, [collectionName, collections]);

  function selectImage(file: DBImage) {
    // if (selected.blobURL) URL.revokeObjectURL(selected.blobURL); this is not safe to do here I think, leave this for later...
    const imageBlob = new Blob([file.imageData], { type: "image/*" });
    setSelectedPreview({
      name: file.filename,
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
        const index = state.zones.findIndex(
          (zone) => zone.key === targetZone.key
        );
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
    <ColumnLayout $height="100vh" $proportions="40%" {...rest}>
      <RowLayout>
        <ColumnLayout $height="100%">
          <RowFlexLayout>
            <BoxContainer $height="auto">
              <select onChange={(e) => setCollectionName(e.target.value)}>
                <option value="">--Please choose a collection!--</option>
                {Object.entries(collections).map((e) => {
                  return (
                    <option value={e[1].name} key={e[1].name}>
                      {e[1].name}
                    </option>
                  );
                })}
              </select>
            </BoxContainer>
            <StyledZoneControl
              previewAvailable={selectedPreview.name.length > 0}
              zones={zones}
              addEmptyZone={addEmptyZone}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
            />
          </RowFlexLayout>

          <StyledFileList
            filesContent={filesContent}
            selectedPreview={selectedPreview}
            selectImage={selectImage}
          />
        </ColumnLayout>
        <StyledImportPreview
          imageURL={selectedPreview.blobURL}
          zones={zones}
          handleSetZone={handleSetZone}
          handleCommitZone={handleCommitZone}
          selectedZone={selectedZone}
        />
      </RowLayout>
    </ColumnLayout>
  );
}

const StyledImport = styled(Import)``;

export default StyledImport;
