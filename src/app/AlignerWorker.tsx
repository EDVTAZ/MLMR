/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';

type ProgressType = { orig: number; transl: number };

type WorkerProviderType = {
  worker: null | Worker;
  setWorker: Dispatch<SetStateAction<null | Worker>>;
  needed: boolean;
  setNeeded: Dispatch<SetStateAction<boolean>>;
  progress: null | ProgressType;
  setProgress: Dispatch<SetStateAction<null | ProgressType>>;
};

export const WorkerContext = createContext<WorkerProviderType>({
  worker: null,
  setWorker: (_w) => {},
  needed: false,
  setNeeded: (_n) => {},
  progress: null,
  setProgress: (_p) => {},
});

export function WorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<null | Worker>(null);
  const [needed, setNeeded] = useState(false);
  const [progress, setProgress] = useState<null | ProgressType>(null);

  return (
    <WorkerContext.Provider
      value={{ worker, setWorker, needed, setNeeded, progress, setProgress }}
    >
      {needed && <AlignerWorker />}
      {children}
    </WorkerContext.Provider>
  );
}

function AlignerWorker() {
  const { worker, setWorker, setNeeded, setProgress } =
    useContext(WorkerContext);

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
        setProgress((prev: null | ProgressType) => {
          return {
            orig: data['progressIndex'] / data['progressMax'],
            transl: prev?.transl ?? 0,
          };
        });
      }
      if (data['msg'] === 'transl-written') {
        setProgress((prev: null | ProgressType) => {
          return {
            transl: data['progressIndex'] / data['progressMax'],
            orig: prev?.orig ?? 0,
          };
        });
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
