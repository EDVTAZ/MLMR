import { Card } from '@chakra-ui/react';
import { useCallback, useContext } from 'react';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { percentFormat } from '../util/percent-format';
import { useWorkerMessageListener } from '../util/useAddEventListener';
import { ProgressBar } from './ProgressBar';

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
      <Card
        style={{
          position: 'fixed',
          right: '2px',
          top: '2px',
          zIndex: 2,
          overflow: 'hidden',
          opacity: 0.75,
        }}
      >
        <ProgressBar
          text={`Original: ${percentFormat(progress.orig)}`}
          value={progress.orig}
          barPosition="top"
        />{' '}
        <ProgressBar
          text={`Translation: ${percentFormat(progress.transl)}`}
          value={progress.transl}
          barPosition="bottom"
        />
      </Card>
    )
  );
}
