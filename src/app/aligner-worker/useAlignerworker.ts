import { useCallback, useContext, useEffect } from 'react';
import { WorkerContext } from './AlignerWorker';
import { useNavigate } from 'react-router-dom';
import { useWorkerMessageListener } from '../util/useAddEventListener';

export function useLoadAlignerWorker() {
  const { setNeeded } = useContext(WorkerContext);

  useEffect(() => {
    setNeeded(true);
  }, []);
}

export function useRedirectToInProgressImport(collectionName: string) {
  const navigate = useNavigate();
  const { worker } = useContext(WorkerContext);

  const messageHandler = useCallback(
    ({ data }: MessageEvent) => {
      if (data['msg'] === 'orig-written') {
        localStorage[`${data['collectionName']}-orig`] = data['count'];
        navigate(`/read/${collectionName}`);
      }
    },
    [collectionName, navigate]
  );
  useWorkerMessageListener(worker, messageHandler);
}
