import { useCallback, useState } from 'react';
import { useAddEventListener } from '../util/useAddEventListener';

type ZoomSliderProps = {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
};

export function ZoomSlider({ zoom, setZoom }: ZoomSliderProps) {
  return (
    <>
      <input
        type="range"
        list="tickmarks"
        min="10"
        max="100"
        step="10"
        id="zoom"
        name="zoom"
        value={zoom}
        onChange={(ev) => setZoom(parseInt(ev.target.value))}
        style={{
          position: 'fixed',
          bottom: '5vh',
          left: '50%',
          transform: 'translate(-50%, 0)',
          width: '40vw',
          zIndex: 2,
        }}
      />
      <datalist id="tickmarks">
        {Array(10)
          .fill(1)
          .map((_, index) => (
            <option value={(index + 1) * 10} key={index}></option>
          ))}
      </datalist>
    </>
  );
}

export function useZoomControl(): [
  number,
  React.Dispatch<React.SetStateAction<number>>
] {
  const [zoom, setZoom] = useState(90);

  const keyPressHandler = useCallback((ev: KeyboardEvent) => {
    if (ev.key === '+') setZoom((z) => Math.min(z + 10, 200));
    else if (ev.key === '-') setZoom((z) => Math.max(z - 10, 10));
    else return;
    ev.preventDefault();
  }, []);
  useAddEventListener('keydown', keyPressHandler);

  return [zoom, setZoom];
}
