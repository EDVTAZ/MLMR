/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { useAlignmentInProgressLocalStorage } from './storage';

type ProgressType = { orig: number; transl: number };

type WorkerProviderType = {
  worker: null | Worker;
  setWorker: Dispatch<SetStateAction<null | Worker>>;
  needed: boolean;
  setNeeded: Dispatch<SetStateAction<boolean>>;
  progress: ProgressType;
  setProgress: Dispatch<SetStateAction<ProgressType>>;
  inProgress: null | false | string;
  setInProgress: Dispatch<SetStateAction<null | false | string>>;
};

export const WorkerContext = createContext<WorkerProviderType>({
  worker: null,
  setWorker: (_w) => {},
  needed: false,
  setNeeded: (_n) => {},
  progress: { orig: 0, transl: 0 },
  setProgress: (_p) => {},
  inProgress: null,
  setInProgress: (_p) => {},
});

export function WorkerProvider({ children }: PropsWithChildren) {
  const [worker, setWorker] = useState<null | Worker>(null);
  const [needed, setNeeded] = useState(false);
  const [progress, setProgress] = useState<ProgressType>({
    orig: 0,
    transl: 0,
  });
  const { value: inProgress, setValue: setInProgress } =
    useAlignmentInProgressLocalStorage();

  useEffect(() => {
    if (inProgress !== null && inProgress !== false) {
      setNeeded(true);
    }
  }, [inProgress]);

  useEffect(() => {
    setProgress({ orig: 0, transl: 0 });
  }, [needed]);

  return (
    <WorkerContext.Provider
      value={{
        worker,
        setWorker,
        needed,
        setNeeded,
        progress,
        setProgress,
        inProgress,
        setInProgress,
      }}
    >
      {needed && <AlignerWorker />}
      {children}
    </WorkerContext.Provider>
  );
}

function AlignerWorker() {
  const { worker, setWorker, setNeeded, setProgress, setInProgress } =
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
        setInProgress(false);
      }
      if (data['msg'] === 'orig-written') {
        localStorage[`${data['collectionName']}-orig`] = data['count'];
        setProgress((prev: ProgressType) => {
          return {
            ...prev,
            orig: data['progressIndex'] / data['progressMax'],
          };
        });
      }
      if (data['msg'] === 'transl-written') {
        setProgress((prev: ProgressType) => {
          return {
            ...prev,
            transl: data['progressIndex'] / data['progressMax'],
          };
        });
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
