import { useEffect, type PropsWithChildren } from 'react';
import { useBrightnessLocalStorage } from './storage';

const BRIGHTNESS_FRACTION = 10;

export function DimBrightness() {
  const brightness = useBrightnessLocalStorage();

  useEffect(() => {
    function stepBrightness(amount: number) {
      brightness.setValue((prev) => {
        return (
          Math.max(
            1,
            Math.min(
              Math.floor((prev ?? 1) * BRIGHTNESS_FRACTION) + amount,
              BRIGHTNESS_FRACTION
            )
          ) / BRIGHTNESS_FRACTION
        );
      });
    }

    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.target.nodeName === 'INPUT') return;

      if (ev.key === 'm') stepBrightness(1);
      else if (ev.key === 'n') stepBrightness(-1);
      else return;
    }
    document.addEventListener('keydown', keyPressHandler);
    return () => {
      document.removeEventListener('keydown', keyPressHandler);
    };
  }, []);

  return (
    <div
      style={{
        backdropFilter: `sepia(${1 - (brightness.value ?? 1)}) brightness(${
          brightness.value ?? 1
        })`,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        zIndex: '100',
        pointerEvents: 'none',
        touchAction: 'none',
      }}
    />
  );
}
