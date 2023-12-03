import { DisplayImage } from "@/ImageComposite/types";
import { CompleteZone } from "@/types";

export function getDisplayImageID(
  urlIdx: number,
  url: string,
  zone: CompleteZone
): string {
  return `${urlIdx}-${url}-${zone.key}-${Object.values(zone.rectangle).join(
    "/"
  )}`;
}

export function generateURLsToLoad(
  urls: { [key: number]: string },
  zones: CompleteZone[]
): { [key: string]: DisplayImage } {
  const rv: { [key: string]: DisplayImage } = {};
  for (const urlIdx in urls) {
    const urlIdxInt = parseInt(urlIdx);
    for (const zoneIdx in zones) {
      const id = getDisplayImageID(urlIdxInt, urls[urlIdx], zones[zoneIdx]);
      rv[id] = {
        id,
        url: urls[urlIdx],
        transparency: 1,
        position: zones[zoneIdx].rectangle,
      };
    }
  }
  return rv;
}
