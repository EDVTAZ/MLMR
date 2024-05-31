import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useIDBImage, useIDBImageInfo } from './storage';
import { WorkerContext } from './AlignerWorker';

function getStyle(
  show: boolean,
  peeking: boolean,
  mousePos: { x: number; y: number },
  elem: HTMLDivElement | null
): React.CSSProperties {
  const rv: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0',
    top: '0',
    zIndex: '1',
  };
  if (!show) {
    rv['zIndex'] = 0;
  }
  if (peeking && elem) {
    const rect = elem.getBoundingClientRect();
    const r = Math.floor(window.innerWidth * 0.05);
    const left = mousePos.x - rect.left;
    const top = mousePos.y - r - rect.top;
    if (
      left > -r &&
      top > -r &&
      left < rect.width + r &&
      top < rect.height + r
    ) {
      if (!show) {
        rv['clipPath'] = `circle(${r}px at ${left}px ${top}px)`;
        rv['zIndex'] = 1;
      } else {
        rv['zIndex'] = 0;
      }
    }
  }
  return rv;
}

type PageProps = {
  collectionName: string;
  index: number;
  language: 'orig' | 'transl';
  shouldLoad: boolean;
  peeking: boolean;
  mousePos: { x: number; y: number };
};

export const Page = forwardRef<HTMLDivElement | null, PageProps>(function Page(
  { collectionName, index, language, shouldLoad, peeking, mousePos, ...rest },
  ref
) {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  const { blobURL: originalPage } = useIDBImage(
    collectionName,
    'out_orig',
    index,
    shouldLoad
  );
  const { blobURL: translatedPage, refresh: refreshTransl } = useIDBImage(
    collectionName,
    'out_transl',
    index,
    shouldLoad
  );
  const { ratio } = useIDBImageInfo(collectionName, 'out_orig', index);
  let effectiveLanguage = language;
  if (!shouldLoad) {
    peeking = false;
  }
  if (translatedPage === '') {
    effectiveLanguage = 'orig';
    peeking = false;
  }

  const { worker } = useContext(WorkerContext);
  useEffect(() => {
    if (!worker) return;

    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'transl-written' && data['newIndexes'].has(index)) {
        refreshTransl();
      }
    }

    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, refreshTransl, index]);

  return (
    <div
      style={{
        aspectRatio: ratio,
        width: '100%',
        margin: '8px 0',
        position: 'relative',
      }}
      ref={localRef}
    >
      <img
        src={originalPage}
        style={getStyle(
          effectiveLanguage === 'orig',
          peeking,
          mousePos,
          localRef.current
        )}
        key={'original'}
        alt={'loading'}
      />
      <img
        src={translatedPage}
        style={getStyle(
          effectiveLanguage === 'transl',
          peeking,
          mousePos,
          localRef.current
        )}
        key={'translated'}
        alt={'loading'}
      />
    </div>
  );
});
