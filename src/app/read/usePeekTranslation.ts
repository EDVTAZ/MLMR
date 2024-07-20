import { useCallback, useState } from 'react';
import { useAddEventListener } from '../util/useAddEventListener';

export function usePeekTranslation() {
  const [language, setLanguage] = useState<'orig' | 'transl'>('orig');
  const [peeking, setPeeking] = useState(false);
  const [switchMC, setSwitchMC] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    setMousePos({ x: ev.clientX, y: ev.clientY });
  }, []);
  useAddEventListener('pointermove', peeking ? handleMouseMove : null);

  const switchLanguage = useCallback(
    () => setLanguage((v) => (v === 'orig' ? 'transl' : 'orig')),
    []
  );

  const keyPressHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'v') switchLanguage();
      else return;
      ev.preventDefault();
    },
    [switchLanguage]
  );
  useAddEventListener('keydown', keyPressHandler);

  const clickHandler = useCallback(
    (ev: MouseEvent) => {
      if (
        ev.button === (switchMC ? 2 : 0) &&
        (ev.target as HTMLElement)?.id !== 'page-counter' &&
        (ev.target as HTMLElement)?.id !== 'switch-peek'
      ) {
        switchLanguage();
        ev.preventDefault();
      }
      if (ev.button === (switchMC ? 0 : 2)) {
        setMousePos({ x: ev.clientX, y: ev.clientY });
        setPeeking(true);
        ev.preventDefault();
      }
    },
    [switchLanguage, switchMC]
  );
  useAddEventListener('mousedown', clickHandler);

  const clickReleaseHandler = useCallback(
    (ev: MouseEvent) => {
      if (ev.button === (switchMC ? 0 : 2)) {
        setPeeking(false);
        ev.preventDefault();
      }
    },
    [switchMC]
  );
  useAddEventListener('mouseup', clickReleaseHandler);

  const touchStartHandler = useCallback((ev: TouchEvent) => {
    setMousePos({
      x: ev.changedTouches[0].clientX,
      y: ev.changedTouches[0].clientY,
    });
    setPeeking(true);
  }, []);
  useAddEventListener('touchstart', switchMC ? touchStartHandler : null);

  const touchMoveHandler = useCallback((ev: TouchEvent) => {
    setMousePos({
      x: ev.changedTouches[0].clientX,
      y: ev.changedTouches[0].clientY,
    });
  }, []);
  useAddEventListener('touchmove', switchMC ? touchMoveHandler : null);

  const touchEndHandler = useCallback((ev: Event) => {
    setPeeking(false);
  }, []);
  useAddEventListener('touchend', switchMC ? touchEndHandler : null);
  useAddEventListener('touchcancel', switchMC ? touchEndHandler : null);

  return {
    language,
    setLanguage,
    peeking,
    setPeeking,
    switchMC,
    setSwitchMC,
    mousePos,
    setMousePos,
  };
}
