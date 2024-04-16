import { ParamParseKey, Params, useLoaderData } from 'react-router-dom';
import { useCollectionLocalStorage } from './storage';
import { Page } from './Page';
import styled from 'styled-components';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.key === 'v')
        setLanguage((v) => (v === 'orig' ? 'transl' : 'orig'));
      // else if (ev.key === 'ArrowLeft' || ev.key === 'a') step(1);
      // else if (ev.key === 'ArrowRight' || ev.key === 'd') step(-1);
      // else if (ev.key === '+') setZoom((z) => Math.min(z + 10, 100));
      // else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
      // else if (ev.key === 'i') setOffset((o) => o + 1);
      // else if (ev.key === 'o') setOffset((o) => o - 1);
      else return;
      ev.preventDefault();
    }
    document.addEventListener('keydown', keyPressHandler);
    return () => {
      document.removeEventListener('keydown', keyPressHandler);
    };
  }, []);

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
