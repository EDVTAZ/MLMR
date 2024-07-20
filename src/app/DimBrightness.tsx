import { useCallback } from 'react';
import { useBrightnessLocalStorage } from './util/useLocalStorage';
import { useAddEventListener } from './util/useAddEventListener';

const BRIGHTNESS_FRACTION = 10;

export function DimBrightness() {
  const brightness = useBrightnessLocalStorage();

  const stepBrightness = useCallback(
    (amount: number) => {
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
    },
    [brightness.setValue]
  );

  const keypressHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLElement && ev.target.nodeName === 'INPUT')
        return;

      if (ev.key === 'm') stepBrightness(1);
      else if (ev.key === 'n') stepBrightness(-1);
      else return;
    },
    [stepBrightness]
  );

  useAddEventListener('keydown', keypressHandler);

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
