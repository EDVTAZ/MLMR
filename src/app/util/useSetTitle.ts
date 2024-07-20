import { useEffect } from 'react';

export function useSetTitle(title: string) {
  useEffect(() => {
    document.title = `${title} - MLMR`;
  }, [title]);
}
