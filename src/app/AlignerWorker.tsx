/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, PropsWithChildren } from 'react';

type WorkerProviderType = {
  worker: null | Worker;
  setWorker: Dispatch<null | Worker>;
  needed: boolean;
  setNeeded: Dispatch<boolean>;
};

export const WorkerContext = createContext<WorkerProviderType>({
  worker: null,
  setWorker: (_w) => {},
  needed: false,
  setNeeded: (_n) => {},
});

export function WorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<null | Worker>(null);
  const [needed, setNeeded] = useState(false);

  return (
    <WorkerContext.Provider value={{ worker, setWorker, needed, setNeeded }}>
      {needed && <AlignerWorker />}
      {children}
    </WorkerContext.Provider>
  );
}

function AlignerWorker() {
  const { worker, setWorker, setNeeded } = useContext(WorkerContext);

  useEffect(() => {
    console.log('Starting aligner module initialization!');
    const w = new Worker('aligner.js');
    setWorker(w);
    return () => {
      w.terminate();
      setWorker(null);
    };
  }, []);

  useEffect(() => {
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'done') {
        setNeeded(false);
      }
      if (data['msg'] === 'orig-written') {
        localStorage[`${data['collectionName']}-orig`] = data['count'];
      }
      if (data['msg'] === 'transl-written') {
        // pass
      }
    }
    if (worker) {
      worker.addEventListener('message', messageHandler);
      return () => {
        worker.removeEventListener('message', messageHandler);
      };
    }
  }, [worker]);

  return null;
}
