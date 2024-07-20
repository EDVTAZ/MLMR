import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import {
  useCollectionLocalStorage,
  useCollectionPositionLocalStorage,
} from '../util/useLocalStorage';
import { Page } from './Page';
import styled from 'styled-components';
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { useAddEventListener } from '../util/useAddEventListener';

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

function calculateScroll(
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>
) {
  const page = pageRefs.current.reduce((prev, v, i): number => {
    if ((v?.getBoundingClientRect().bottom ?? 0) > 0) {
      return Math.min(prev, i);
    }
    return prev;
  }, pageRefs.current?.length ?? 0);

  const { top, bottom } = pageRefs.current[page]?.getBoundingClientRect() ?? {
    top: 0,
    bottom: 0,
  };
  const percentage = top >= 0 ? 0 : top / (top - bottom);
  return { page, percentage };
}

function scrollToPosition(
  page: number,
  percentage: number,
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>
) {
  const targetDiv = pageRefs.current[page];
  if (targetDiv) {
    const targetRect = targetDiv.getBoundingClientRect();
    window.scrollBy({
      top: targetRect.top + targetRect.height * percentage,
      behavior: 'instant',
    });
  }
}

function ReadCollectionUnstyled({ ...rest }) {
  const { collectionName } = useLoaderData() as ReturnType<
    typeof readCollectionLoader
  >;
  const [language, setLanguage] = useState<'orig' | 'transl'>('orig');
  const [currentPage, setCurrentPage] = useState({ page: 0, percentage: 0 });
  const localStorageCurrentPage =
    useCollectionPositionLocalStorage(collectionName);

  const [zoomSlider, setZoomSlider] = useState(false);
  const [zoom, setZoom] = useState(90);

  const originalCount = useCollectionLocalStorage(collectionName);
  const { worker, inProgress, progress } = useContext(WorkerContext);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollingRef = useRef({ scrolling: false, adjusting: false });

  const [peeking, setPeeking] = useState(false);
  const [switchMC, setSwitchMC] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    document.title = `${collectionName} - MLMR`;
  }, [collectionName]);

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    setMousePos({ x: ev.clientX, y: ev.clientY });
  }, []);
  useAddEventListener('pointermove', peeking ? handleMouseMove : null);

  const switchLanguage = useCallback(
    () => setLanguage((v) => (v === 'orig' ? 'transl' : 'orig')),
    []
  );

  const stepPage = useCallback(
    (amount: number) => {
      const calculatedPosition = calculateScroll(pageRefs);
      scrollToPosition(
        Math.min(
          Math.max(0, calculatedPosition.page + amount),
          (originalCount.value ?? 1) - 1
        ),
        0,
        pageRefs
      );
    },
    [originalCount.value]
  );

  const keyPressHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'v') switchLanguage();
      else if (ev.key === 'ArrowLeft' || ev.key === 'a') stepPage(-1);
      else if (ev.key === 'ArrowRight' || ev.key === 'd') stepPage(1);
      else if (ev.key === '+') setZoom((z) => Math.min(z + 10, 200));
      else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
      else return;
      ev.preventDefault();
    },
    [stepPage, switchLanguage]
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

  useEffect(() => {
    if (!worker) return;
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'orig-written') {
        originalCount.setValue(data['count']);
      }
    }
    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, originalCount.setValue]);

  const scrollHandler = useCallback((_event: Event) => {
    setCurrentPage(calculateScroll(pageRefs));
    scrollingRef.current.scrolling = true;
  }, []);
  useAddEventListener('scroll', scrollHandler);

  const scrollendHandler = useCallback((_event: Event) => {
    if (!scrollingRef.current.adjusting) {
      localStorageCurrentPage.setValue(calculateScroll(pageRefs));
    }
    scrollingRef.current = { scrolling: false, adjusting: false };
  }, []); // setter dep unneeded localStorageCurrentPage.setValue
  useAddEventListener('scrollend', scrollendHandler);

  useLayoutEffect(() => {
    let firstCall = true;
    function scrollToSavedPosition() {
      if (firstCall) {
        firstCall = false;
        return;
      }

      scrollingRef.current.adjusting = true;

      if (
        localStorageCurrentPage.value === null ||
        (inProgress === collectionName && scrollingRef.current.scrolling)
      ) {
        return;
      }

      const containers = pageRefs.current.map(
        (element) =>
          element?.getBoundingClientRect() ?? { top: 0, bottom: 0, height: 0 }
      );
      if (containers.some((rect) => rect.height === 0)) return;

      scrollToPosition(
        localStorageCurrentPage.value.page,
        localStorageCurrentPage.value.percentage,
        pageRefs
      );
    }

    const observer = new ResizeObserver(scrollToSavedPosition);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [
    collectionName,
    localStorageCurrentPage.value?.page,
    localStorageCurrentPage.value?.percentage,
    inProgress,
  ]);

  return (
    <div
      className={'container'}
      style={{ alignItems: zoom > 90 ? 'start' : 'center' }}
      ref={containerRef}
      {...rest}
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
                  Math.abs(currentPage.page - index) <= IMAGE_CACHE_RANGE
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
          {`${currentPage.page + 1} / ${originalCount.value}`}
          <br />
          {Intl.NumberFormat(navigator.language, { style: 'percent' }).format(
            currentPage.percentage
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

export const ReadCollection = styled(ReadCollectionUnstyled)`
  display: flex;
  flex-direction: column;
`;
