import { useLayoutEffect, useRef, useState } from "react";
import { difference, intersection } from "./setOperations";
import { ImageResults } from "./types";

export function useImages(urls: {
  [key: string]: string;
}): [ImageResults, number] {
  const imagesRef = useRef<ImageResults>({});

  // unused state, used for triggering update
  const [stateUpdated, setStateUpdated] = useState(0);

  const stateKeys = Object.keys(imagesRef.current);
  const inputKeys = Object.keys(urls);
  const newKeys = difference(inputKeys, stateKeys);
  const matchingKeys = intersection(inputKeys, stateKeys);

  if (newKeys.length > 0 || matchingKeys.length != stateKeys.length) {
    imagesRef.current = {
      ...Object.fromEntries(
        Object.entries(imagesRef.current).filter(([key, val]) => {
          matchingKeys.includes(key);
        })
      ),
      ...Object.fromEntries(
        newKeys.map((key) => [
          key,
          { url: urls[key], element: undefined, state: "loading" },
        ])
      ),
    };

    setStateUpdated((prev) => prev + 1);
  }

  useLayoutEffect(() => {
    for (const key in imagesRef.current) {
      if (key in newKeys) {
        let img = document.createElement("img");

        // what happens if I don't clean up these listeners? we'll find out...
        img.addEventListener("load", () => {
          if (!(key in imagesRef.current)) return;
          imagesRef.current[key].state = "loaded";
          imagesRef.current[key].element = img;
          setStateUpdated((prev) => prev + 1);
        });
        img.addEventListener("error", () => {
          if (!(key in imagesRef.current)) return;
          imagesRef.current[key].state = "failed";
          imagesRef.current[key].element = undefined;
          setStateUpdated((prev) => prev + 1);
        });

        img.src = imagesRef.current[key].url;
      }
    }
  }, [newKeys.length]);

  return [imagesRef.current, stateUpdated];
}
