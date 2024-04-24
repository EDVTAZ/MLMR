import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import {
  useCollectionLocalStorage,
  useCollectionPositionLocalStorage,
} from './storage';
import { Page } from './Page';
import styled from 'styled-components';
import { useContext, useEffect, useRef, useState } from 'react';
import { WorkerContext } from './AlignerWorker';

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

  const originalCount = useCollectionLocalStorage(collectionName);
  const { worker } = useContext(WorkerContext);

  const pageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    function switchLanguage() {
      setLanguage((v) => (v === 'orig' ? 'transl' : 'orig'));
    }
    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.key === 'v') switchLanguage();
      // else if (ev.key === 'ArrowLeft' || ev.key === 'a') step(1);
      // else if (ev.key === 'ArrowRight' || ev.key === 'd') step(-1);
      // else if (ev.key === '+') setZoom((z) => Math.min(z + 10, 100));
      // else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
      // else if (ev.key === 'i') setOffset((o) => o + 1);
      // else if (ev.key === 'o') setOffset((o) => o - 1);
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
  }, []);

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
      localStorageCurrentPage.setValue(JSON.stringify(calculateScroll()));
    }

    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('scrollend', scrollendHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('scrollend', scrollendHandler);
    };
  }, [originalCount.value]);

  return (
    <div {...rest}>
      {collectionName &&
        new Array(originalCount.value).fill(0).map((_e, index) => {
          return (
            <Page
              collectionName={collectionName}
              index={index}
              key={index}
              language={language}
              ref={(node: HTMLElement | null) => {
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
        }}
      >
        {`${currentPage.page + 1} / ${originalCount.value}`}
        <br />
        {`${Intl.NumberFormat(navigator.language, { style: 'percent' }).format(
          currentPage.percentage
        )}`}
      </div>
    </div>
  );
}

export const ReadCollection = styled(ReadCollectionUnstyled)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
