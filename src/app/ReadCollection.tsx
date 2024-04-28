import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import {
  useCollectionLocalStorage,
  useCollectionPositionLocalStorage,
} from './storage';
import { Page } from './Page';
import styled from 'styled-components';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { WorkerContext } from './AlignerWorker';

const IMAGE_CACHE_RANGE = 10;

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

function ReadCollectionUnstyled({ ...rest }) {
  const { collectionName } = useLoaderData() as ReturnType<
    typeof readCollectionLoader
  >;
  const [language, setLanguage] = useState<'orig' | 'transl'>('orig');
  const [currentPage, setCurrentPage] = useState({ page: 0, percentage: 0 });
  const localStorageCurrentPage =
    useCollectionPositionLocalStorage(collectionName);

  const [zoom, setZoom] = useState(90);

  const originalCount = useCollectionLocalStorage(collectionName);
  const { worker, needed, progress } = useContext(WorkerContext);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    function switchLanguage() {
      setLanguage((v) => (v === 'orig' ? 'transl' : 'orig'));
    }
    function step(amount: number) {
      localStorageCurrentPage.setValue((prev) => {
        return {
          page: Math.min(
            Math.max(0, (prev?.page ?? 0) + amount),
            (originalCount.value ?? 1) - 1
          ),
          percentage: 0,
        };
      });
    }
    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.key === 'v') switchLanguage();
      else if (ev.key === 'ArrowLeft' || ev.key === 'a') step(-1);
      else if (ev.key === 'ArrowRight' || ev.key === 'd') step(1);
      else if (ev.key === '+') setZoom((z) => Math.min(z + 10, 200));
      else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
      else return;
      ev.preventDefault();
    }
    function clickHandler(ev: MouseEvent) {
      if (ev.button === 0) {
        switchLanguage();
        ev.preventDefault();
      }
    }
    document.addEventListener('keydown', keyPressHandler);
    document.addEventListener('mousedown', clickHandler);
    return () => {
      document.removeEventListener('keydown', keyPressHandler);
      document.removeEventListener('mousedown', clickHandler);
    };
  }, [originalCount]);

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

  useEffect(() => {
    function calculateScroll() {
      const page = pageRefs.current.reduce((prev, v, i): number => {
        if ((v?.getBoundingClientRect().bottom ?? 0) > 0) {
          return Math.min(prev, i);
        }
        return prev;
      }, originalCount.value ?? 0);

      const { top, bottom } = pageRefs.current[
        page
      ]?.getBoundingClientRect() ?? { top: 0, bottom: 0 };
      const percentage = top >= 0 ? 0 : top / (top - bottom);
      return { page, percentage };
    }

    function scrollHandler(_event: Event) {
      setCurrentPage(calculateScroll());
    }
    function scrollendHandler(_event: Event) {
      localStorageCurrentPage.setValue(calculateScroll());
    }

    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('scrollend', scrollendHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('scrollend', scrollendHandler);
    };
  }, [originalCount.value]);

  useLayoutEffect(() => {
    function scrollToSavedPosition() {
      const containers = pageRefs.current.map(
        (element) =>
          element?.getBoundingClientRect() ?? { top: 0, bottom: 0, height: 0 }
      );
      if (
        containers.some((rect) => rect.height === 0) ||
        localStorageCurrentPage.value === null
      )
        return;

      const targetDiv = pageRefs.current[localStorageCurrentPage.value.page];
      if (targetDiv) {
        const targetRect = containers[localStorageCurrentPage.value.page];
        window.scrollBy({
          top:
            targetRect.top +
            targetRect.height * localStorageCurrentPage.value.percentage,
          behavior: 'instant',
        });
      }
    }

    const observer = new ResizeObserver(scrollToSavedPosition);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [
    localStorageCurrentPage.value?.page,
    localStorageCurrentPage.value?.percentage,
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
                ref={(node: HTMLDivElement | null) => {
                  pageRefs.current[index] = node;
                }}
              />
            );
          })}
        <div
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
        {needed && (
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
            }).format(progress?.orig ?? 0)}`}
            <br />
            {`Translation: ${Intl.NumberFormat(navigator.language, {
              style: 'percent',
            }).format(progress?.transl ?? 0)}`}
          </div>
        )}
      </div>
    </div>
  );
}

export const ReadCollection = styled(ReadCollectionUnstyled)`
  display: flex;
  flex-direction: column;
`;
