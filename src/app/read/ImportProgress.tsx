import { useCallback, useContext } from 'react';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { useWorkerMessageListener } from '../util/useAddEventListener';

type ImportProgressProps = {
  collectionName: string | undefined;
  setOrigPageCount: React.Dispatch<React.SetStateAction<number | null>>;
};

export function ImportProgress({
  collectionName,
  setOrigPageCount,
}: ImportProgressProps) {
  const { worker, inProgress, progress } = useContext(WorkerContext);

  const messageHandler = useCallback(({ data }: MessageEvent) => {
    if (data['msg'] === 'orig-written') {
      setOrigPageCount(data['count']);
    }
  }, []); // originalCount.setValue = setOrigPageCount not needed because it is a state setter
  useWorkerMessageListener(worker, messageHandler);

  return (
    collectionName === inProgress && (
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
    )
  );
}
