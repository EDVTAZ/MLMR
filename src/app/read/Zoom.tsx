import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useAddEventListener } from '../util/useAddEventListener';

type ZoomSliderProps = {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
};

export function ZoomSlider({ zoom, setZoom }: ZoomSliderProps) {
  return (
    <Slider
      colorScheme="gray"
      defaultValue={zoom}
      min={10}
      max={100}
      step={5}
      id="zoom"
      name="zoom"
      onChange={(val) => setZoom(val)}
      w="40vw"
    >
      <SliderTrack>
        <SliderFilledTrack />
      </SliderTrack>
      <SliderThumb />
    </Slider>
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
