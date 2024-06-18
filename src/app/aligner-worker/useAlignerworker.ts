import { useContext, useEffect } from 'react';
import { WorkerContext } from './AlignerWorker';
import { useNavigate } from 'react-router-dom';

export function useLoadAlignerWorker() {
  const { setNeeded } = useContext(WorkerContext);

  useEffect(() => {
    setNeeded(true);
  }, []);
}

export function useRedirectToInProgressImport(collectionName: string) {
  const navigate = useNavigate();
  const { worker } = useContext(WorkerContext);

  useEffect(() => {
    if (!worker) return;
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'orig-written') {
        localStorage[`${data['collectionName']}-orig`] = data['count'];
        navigate(`/read/${collectionName}`);
      }
    }
    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, collectionName]);
}
