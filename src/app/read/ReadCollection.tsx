import { useCallback, useContext, useRef, useState } from 'react';
import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import {
  useAddEventListener,
  useWorkerMessageListener,
} from '../util/useAddEventListener';
import { useCollectionLocalStorage } from '../util/useLocalStorage';
import { useSetTitle } from '../util/useSetTitle';
import { Page } from './Page';
import { useScrollControl } from './useScrollControl';

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
  const [language, setLanguage] = useState<'orig' | 'transl'>('orig');

  const [zoomSlider, setZoomSlider] = useState(false);
  const [zoom, setZoom] = useState(90);

  const originalCount = useCollectionLocalStorage(collectionName);
  const { worker, inProgress, progress } = useContext(WorkerContext);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [peeking, setPeeking] = useState(false);
  const [switchMC, setSwitchMC] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const sc = useScrollControl(
    collectionName,
    originalCount.value,
    containerRef,
    pageRefs
  );

  useSetTitle(`${collectionName} - MLMR`);

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    setMousePos({ x: ev.clientX, y: ev.clientY });
  }, []);
  useAddEventListener('pointermove', peeking ? handleMouseMove : null);

  const switchLanguage = useCallback(
    () => setLanguage((v) => (v === 'orig' ? 'transl' : 'orig')),
    []
  );

  const keyPressHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'v') switchLanguage();
      // else if (ev.key === 'ArrowLeft' || ev.key === 'a') stepPage(-1);
      // else if (ev.key === 'ArrowRight' || ev.key === 'd') stepPage(1);
      else if (ev.key === '+') setZoom((z) => Math.min(z + 10, 200));
      else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
      else return;
      ev.preventDefault();
    },
    [switchLanguage]
  );
  useAddEventListener('keydown', keyPressHandler);

  const clickHandler = useCallback(
    (ev: MouseEvent) => {
      if (
        ev.button === (switchMC ? 2 : 0) &&
        (ev.target as HTMLElement)?.id !== 'page-counter' &&
        (ev.target as HTMLElement)?.id !== 'switch-peek'
      ) {
        switchLanguage();
        ev.preventDefault();
      }
      if (ev.button === (switchMC ? 0 : 2)) {
        setMousePos({ x: ev.clientX, y: ev.clientY });
        setPeeking(true);
        ev.preventDefault();
      }
    },
    [switchLanguage, switchMC]
  );
  useAddEventListener('mousedown', clickHandler);

  const clickReleaseHandler = useCallback(
    (ev: MouseEvent) => {
      if (ev.button === (switchMC ? 0 : 2)) {
        setPeeking(false);
        ev.preventDefault();
      }
    },
    [switchMC]
  );
  useAddEventListener('mouseup', clickReleaseHandler);

  const touchStartHandler = useCallback((ev: TouchEvent) => {
    setMousePos({
      x: ev.changedTouches[0].clientX,
      y: ev.changedTouches[0].clientY,
    });
    setPeeking(true);
  }, []);
  useAddEventListener('touchstart', switchMC ? touchStartHandler : null);

  const touchMoveHandler = useCallback((ev: TouchEvent) => {
    setMousePos({
      x: ev.changedTouches[0].clientX,
      y: ev.changedTouches[0].clientY,
    });
  }, []);
  useAddEventListener('touchmove', switchMC ? touchMoveHandler : null);

  const touchEndHandler = useCallback((ev: Event) => {
    setPeeking(false);
  }, []);
  useAddEventListener('touchend', switchMC ? touchEndHandler : null);
  useAddEventListener('touchcancel', switchMC ? touchEndHandler : null);

  const messageHandler = useCallback(({ data }: MessageEvent) => {
    if (data['msg'] === 'orig-written') {
      originalCount.setValue(data['count']);
    }
  }, []); // originalCount.setValue not needed because it is a state setter
  useWorkerMessageListener(worker, messageHandler);

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
                language={language}
                shouldLoad={
                  Math.abs(sc.currentPage.page - index) <= IMAGE_CACHE_RANGE
                }
                peeking={peeking}
                mousePos={mousePos}
                ref={(node: HTMLDivElement | null) => {
                  pageRefs.current[index] = node;
                }}
              />
            );
          })}
        <div
          onClick={(ev) => {
            setZoomSlider((prev) => !prev);
            ev.preventDefault();
            return false;
          }}
          id="page-counter"
          style={{
            position: 'fixed',
            left: '0px',
            bottom: '0px',
            maxWidth: '4vw',
            zIndex: 2,
          }}
        >
          {`${sc.currentPage.page + 1} / ${originalCount.value}`}
          <br />
          {Intl.NumberFormat(navigator.language, { style: 'percent' }).format(
            sc.currentPage.percentage
          )}
        </div>
        {inProgress === collectionName && (
          <div
            style={{
              position: 'fixed',
              right: '0px',
              top: '0px',
              maxWidth: '4vw',
              zIndex: 2,
            }}
          >
            {`Loading...`}
            <br />
            {`Original: ${Intl.NumberFormat(navigator.language, {
              style: 'percent',
            }).format(progress.orig)}`}
            <br />
            {`Translation: ${Intl.NumberFormat(navigator.language, {
              style: 'percent',
            }).format(progress.transl)}`}
          </div>
        )}
        {zoomSlider && (
          <>
            <input
              type="range"
              list="tickmarks"
              min="10"
              max="100"
              step="10"
              id="zoom"
              name="zoom"
              value={zoom}
              onChange={(ev) => setZoom(parseInt(ev.target.value))}
              style={{
                position: 'fixed',
                bottom: '5vh',
                left: '50%',
                transform: 'translate(-50%, 0)',
                width: '40vw',
                zIndex: 2,
              }}
            />
            <datalist id="tickmarks">
              {Array(10)
                .fill(1)
                .map((_, index) => (
                  <option value={(index + 1) * 10} key={index}></option>
                ))}
            </datalist>
          </>
        )}
      </div>
      <div
        onClick={(ev) => {
          setSwitchMC((prev) => !prev);
        }}
        id="switch-peek"
        style={{
          position: 'fixed',
          right: '0px',
          bottom: '0px',
          maxWidth: '4vw',
          zIndex: 2,
        }}
      >
        Switch Peek
      </div>
    </div>
  );
}
