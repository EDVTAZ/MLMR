import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import { useCollectionLocalStorage } from './storage';
import { Page } from './Page';
import styled from 'styled-components';
import { useContext, useEffect, useState } from 'react';
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

  const { originalCount, translatedCount } =
    useCollectionLocalStorage(collectionName);
  const { worker } = useContext(WorkerContext);

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
      if (data['msg'] === 'transl-written') {
        translatedCount.setValue(data['count']);
      }
    }

    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, originalCount.setValue, translatedCount.setValue]);

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
            />
          );
        })}
    </div>
  );
}

export const ReadCollection = styled(ReadCollectionUnstyled)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
