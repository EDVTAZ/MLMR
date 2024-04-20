import { useContext, useEffect } from 'react';
import { useIDBImage } from './storage';
import { WorkerContext } from './AlignerWorker';

function getStyle(show: boolean): React.CSSProperties {
  const rv: React.CSSProperties = { width: '90vw', margin: '8px' };
  if (!show) {
    rv['position'] = 'absolute';
    rv['left'] = -100000;
    rv['top'] = -100000;
  }
  return rv;
}

export function Page({
  collectionName,
  index,
  language,
  ...rest
}: {
  collectionName: string;
  index: number;
  language: 'orig' | 'transl';
}) {
  const { blobURL: originalPage } = useIDBImage(
    collectionName,
    'out_orig',
    index
  );
  const { blobURL: translatedPage, refresh: refreshTransl } = useIDBImage(
    collectionName,
    'out_transl',
    index
  );
  const effectiveLanguage = translatedPage === '' ? 'orig' : language;

  const { worker } = useContext(WorkerContext);
  useEffect(() => {
    if (!worker) return;

    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'transl-written' && data['count'] === index + 1) {
        refreshTransl();
      }
    }

    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, refreshTransl, index]);

  return (
    <>
      <img
        src={originalPage}
        style={getStyle(effectiveLanguage === 'orig')}
        key={'original'}
        alt={'loading'}
      />
      <img
        src={translatedPage}
        style={getStyle(effectiveLanguage === 'transl')}
        key={'translated'}
        alt={'loading'}
      />
    </>
  );
}
