import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { difference, intersection } from "./setOperations";
import { ImageResults } from "./types";
import { validateHeaderName } from "http";

export function useImages(urls: { [key: string]: string }): ImageResults {
  const [images, setImages] = useState<ImageResults>({});

  useEffect(() => {
    setImages((oldImages) => {
      const stateKeys = Object.keys(oldImages);
      const inputKeys = Object.keys(urls);
      const newKeys = difference(inputKeys, stateKeys);
      const matchingKeys = intersection(inputKeys, stateKeys);

      if (newKeys.length > 0 || matchingKeys.length != stateKeys.length) {
        return {
          ...Object.fromEntries(
            Object.entries(oldImages).filter(([key, val]) =>
              matchingKeys.includes(key)
            )
          ),
          ...Object.fromEntries(
            newKeys.map((key) => [
              key,
              { url: urls[key], element: undefined, state: "initializing" },
            ])
          ),
        };
      } else {
        return oldImages;
      }
    });
  }, [urls]);

  useLayoutEffect(() => {
    setImages((oldImages) => {
      const needsInit = Object.fromEntries(
        Object.entries(oldImages).filter(
          ([idx, val]) => val.state == "initializing"
        )
      );
      if (Object.getOwnPropertyNames(needsInit).length > 0) {
        const newImages = { ...oldImages };
        Object.entries(needsInit).forEach(([key, val]) => {
          newImages[key] = { ...oldImages[key], state: "loading" };
          const img = document.createElement("img");

          // what happens if I don't clean up these listeners? we'll find out...
          img.addEventListener("load", function () {
            setImages((oldImages) => {
              if (!(key in oldImages)) return oldImages;
              return {
                ...oldImages,
                [key]: {
                  ...oldImages[key],
                  state: "loaded",
                  element: img,
                },
              };
            });
          });
          img.addEventListener("error", () => {
            setImages((oldImages) => {
              if (!(key in oldImages)) return oldImages;
              return {
                ...oldImages,
                [key]: {
                  ...oldImages[key],
                  state: "failed",
                  element: undefined,
                },
              };
            });
          });

          img.src = oldImages[key].url;
        });
        return newImages;
      } else {
        return oldImages;
      }
    });
  }, [images]);

  return images;
}
