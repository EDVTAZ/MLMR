import { useEffect } from 'react';

export function useAddEventListener<K extends keyof DocumentEventMap>(
  eventType: K,
  eventHandler: null | ((this: Document, ev: DocumentEventMap[K]) => unknown)
) {
  useEffect(() => {
    if (eventHandler === null) return;

    document.addEventListener(eventType, eventHandler);
    return () => {
      document.removeEventListener(eventType, eventHandler);
    };
  }, [eventHandler, eventType]);
}

export function useWorkerMessageListener(
  worker: null | Worker,
  listener: null | ((this: Worker, ev: MessageEvent<unknown>) => unknown)
) {
  useEffect(() => {
    if (listener === null || worker === null) return;

    worker.addEventListener('message', listener);
    return () => {
      worker.removeEventListener('message', listener);
    };
  }, [listener, worker]);
}
