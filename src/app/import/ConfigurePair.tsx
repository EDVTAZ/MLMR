import { ColumnLayout } from "@/styled-components/ColumnLayout";
import StyledImport, { constrainCoordinates } from "./Import";
import { RowLayout } from "@/styled-components/RowLayout";
import { StyledNameInput } from "@/styled-components/NameInput";
import { useMemo, useRef, useState } from "react";
import { getLSCollectionsAll, storePairing } from "@/storage";
import {
  CompleteRectangle,
  CompleteZone,
  DBImage,
  SelectedPreview,
  Zones,
} from "@/types";
import { ImportState, useImportState } from "./import-state";
import { BoxContainer } from "@/styled-components/Container";
import { Layer, Rect, Stage, Image } from "react-konva";
import useImage from "use-image";

const cmpMargin = 0.1;
const cmpAreaWidth = 1 - 2 * cmpMargin;
const cmpAreaHeight = 1 - cmpMargin;

function calculateImageDimensions(
  image: HTMLImageElement,
  contWidth: number,
  contHeight: number,
  importState: ImportState
) {
  let zone = null;
  if (importState.selectedZone[0]) {
    zone = importState.zones[0].zones.find(
      (e) => e.key == importState.selectedZone[0]
    )?.rectangle;
  }
  if (importState.zones[0].inProgressZone?.rectangle.x1) {
    zone = constrainCoordinates(
      importState.zones[0].inProgressZone as CompleteZone
    ).rectangle;
  }
  if (!zone) zone = { x1: 0, y1: 0, x2: 1, y2: 1 };

  const width = (cmpAreaWidth * contWidth) / (zone.x2 - zone.x1);
  const height = image.height * (width / image.width);

  return {
    x: cmpMargin * contWidth - zone.x1 * width,
    y: cmpMargin * contHeight - zone.y1 * height,
    width,
    height,
  };
}

export default function ConfigurePair() {
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);

  const [collections, setCollections] = useState(getLSCollectionsAll());
  const leftImportState = useImportState();
  const rightImportState = useImportState();

  const cmpBoxHeight = overlayContainerRef.current?.clientHeight;
  const cmpBoxWidth = overlayContainerRef.current?.clientWidth;

  const [leftImage, leftImageLoadState] = useImage(
    leftImportState.selectedPreview[0].blobURL
  );
  const [rightImage, rightImageLoadState] = useImage(
    rightImportState.selectedPreview[0].blobURL
  );

  return (
    <ColumnLayout
      $height="100vh"
      $proportions={"minmax(0,30%)".repeat(3)}
      $noPadding={true}
    >
      <StyledImport
        collections={collections}
        importState={leftImportState}
      ></StyledImport>
      <RowLayout $proportions="4rem 1fr 70%">
        <StyledNameInput
          handleSave={(name) => {
            storePairing(
              name,
              leftImportState.collectionName[0],
              rightImportState.collectionName[0],
              leftImportState.zones[0].zones,
              rightImportState.zones[0].zones
            );
          }}
          labelText="Pairing Name:"
          buttonText="Save Pairing"
        />
        <BoxContainer></BoxContainer>
        <BoxContainer $noPadding={true} ref={overlayContainerRef}>
          {cmpBoxHeight && cmpBoxWidth && (
            <Stage width={cmpBoxWidth} height={cmpBoxHeight}>
              <Layer>
                {leftImageLoadState == "loaded" && (
                  <Image
                    image={leftImage}
                    {...calculateImageDimensions(
                      leftImage as HTMLImageElement,
                      cmpBoxWidth,
                      cmpBoxHeight,
                      leftImportState
                    )}
                    key="left"
                    alt="left"
                  />
                )}
                {rightImageLoadState == "loaded" && (
                  <Image
                    image={rightImage}
                    {...calculateImageDimensions(
                      rightImage as HTMLImageElement,
                      cmpBoxWidth,
                      cmpBoxHeight,
                      rightImportState
                    )}
                    key="right"
                    alt="right"
                    opacity={0.5}
                  />
                )}
                <Rect
                  stroke="black"
                  x={cmpMargin * cmpBoxWidth}
                  y={cmpMargin * cmpBoxHeight}
                  width={cmpAreaWidth * cmpBoxWidth}
                  height={cmpAreaHeight * cmpBoxHeight}
                ></Rect>
              </Layer>
            </Stage>
          )}
        </BoxContainer>
      </RowLayout>
      <StyledImport
        collections={collections}
        importState={rightImportState}
      ></StyledImport>
    </ColumnLayout>
  );
}
