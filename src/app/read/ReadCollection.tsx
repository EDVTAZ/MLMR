import { useRef, useState } from 'react';
import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import { useCollectionLocalStorage } from '../util/useLocalStorage';
import { useSetTitle } from '../util/useSetTitle';
import { ImportProgress } from './ImportProgress';
import { Page } from './Page';
import { PositionInfo } from './PositionInfo';
import { SwitchPeek } from './SwitchPeek';
import { usePeekTranslation } from './usePeekTranslation';
import { useScrollControl } from './useScrollControl';
import { useZoomControl, ZoomSlider } from './Zoom';

const IMAGE_CACHE_RANGE = 3;

const PathNames = {
  collectionName: '/read/:collectionName',
} as const;

export function readCollectionLoader({
  params,
}: {
  params: Params<ParamParseKey<typeof PathNames.collectionName>>;
}) {
  return { collectionName: params.collectionName };
}

export function ReadCollection() {
  const { collectionName } = useLoaderData() as ReturnType<
    typeof readCollectionLoader
  >;

  const peek = usePeekTranslation();

  const [zoomSlider, setZoomSlider] = useState(false);
  const [zoom, setZoom] = useZoomControl();

  const originalCount = useCollectionLocalStorage(collectionName);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const sc = useScrollControl(
    collectionName,
    originalCount.value,
    containerRef,
    pageRefs
  );

  useSetTitle(`${collectionName} - MLMR`);

  return (
    <div
      className={'container'}
      style={{
        alignItems: zoom > 90 ? 'start' : 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
      ref={containerRef}
    >
      <div style={{ width: `${zoom}vw` }}>
        {collectionName &&
          new Array(originalCount.value).fill(0).map((_e, index) => {
            return (
              <Page
                collectionName={collectionName}
                index={index}
                key={index}
                language={peek.language}
                shouldLoad={
                  Math.abs(sc.currentPage.page - index) <= IMAGE_CACHE_RANGE
                }
                peeking={peek.peeking}
                mousePos={peek.mousePos}
                ref={(node: HTMLDivElement | null) => {
                  pageRefs.current[index] = node;
                }}
              />
            );
          })}
        <PositionInfo
          currentPage={sc.currentPage}
          pageCount={originalCount.value}
          toggleSettings={() => setZoomSlider((prev) => !prev)}
        />
        <ImportProgress
          collectionName={collectionName}
          setOrigPageCount={originalCount.setValue}
        />
        {zoomSlider && (
          <>
            <ZoomSlider zoom={zoom} setZoom={setZoom} />
            <SwitchPeek toggle={() => peek.setSwitchMC((prev) => !prev)} />
          </>
        )}
      </div>
    </div>
  );
}
