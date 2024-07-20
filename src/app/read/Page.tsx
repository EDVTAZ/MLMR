import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useIDBImage, useIDBImageInfo } from '../util/useIndexedDB';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { PageImage } from './PageImage';
import { useWorkerMessageListener } from '../util/useAddEventListener';

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

  const messageHandler = useCallback(
    ({ data }: MessageEvent) => {
      if (data['msg'] === 'transl-written' && data['newIndexes'].has(index)) {
        refreshTransl();
      }
    },
    [index] // refreshTransl is not using useCallback yet!
  );
  useWorkerMessageListener(worker, messageHandler);

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
      <PageImage
        src={originalPage}
        active={effectiveLanguage === 'orig'}
        peeking={peeking}
        mousePos={mousePos}
        parent={localRef.current}
        key={'original'}
      />
      <PageImage
        src={translatedPage}
        active={effectiveLanguage === 'transl'}
        peeking={peeking}
        mousePos={mousePos}
        parent={localRef.current}
        key={'translated'}
      />
    </div>
  );
});
