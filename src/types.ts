export type Rectangle = {
  x1: number | null;
  x2: number | null;
  y1: number | null;
  y2: number | null;
};

export type CompleteRectangle = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type CompleteZone = {
  rectangle: CompleteRectangle;
  key: number;
};

export type Zone = {
  rectangle: Rectangle;
  key: number;
};

export type Zones = {
  zones: Array<CompleteZone>;
  inProgressZone: Zone | null;
};

export type ReaderPosition = {
  count: number;
  scroll: "start" | "end";
};

export type CollectionInfo = {
  name: string;
  zones: Array<Zone>;
  length: number;
  position: number;
};

export type LocalStorageCollections = {
  [key: string]: CollectionInfo;
};

export type DBImage = {
  filename: string;
  pageNumber: number;
  imageData: ArrayBuffer;
};
