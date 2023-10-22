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

export type Zone = {
  rectangle: Rectangle;
  key: number;
};

export type Zones = {
  zones: Array<Zone>;
  inProgressZone: Zone | null;
};

export type ReaderPosition = {
  count: number;
  scroll: "start" | "end";
};
