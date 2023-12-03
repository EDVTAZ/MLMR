import { CompleteRectangle } from "@/types";

export type DisplayImage = {
  id: string;
  url: string;
  transparency: number;
  position: CompleteRectangle;
};

export type HeightOpenDimensions = {
  width: number;
  setHeight?: (height: number) => void;
};

export type CompleteDimensions = {
  width: number;
  height: number;
};

export type ImageCompositeDimensions =
  | HeightOpenDimensions
  | CompleteDimensions;

export type ImageResult = {
  url: string;
  element: undefined | HTMLImageElement;
  state: "loaded" | "loading" | "failed";
};

export type ImageResults = { [key: string]: ImageResult };

export type CanvasPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};
