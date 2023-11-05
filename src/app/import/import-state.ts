import { DBImage, SelectedPreview, Zones } from "@/types";
import { Dispatch, SetStateAction, useState } from "react";

type UseStateReturn<S> = [S, Dispatch<SetStateAction<S>>];

export type ImportState = {
  collectionName: UseStateReturn<string>;
  filesContent: UseStateReturn<DBImage[]>;
  selectedPreview: UseStateReturn<SelectedPreview>;
  zones: UseStateReturn<Zones>;
  selectedZone: UseStateReturn<number | null>;
};

export function useImportState(): ImportState {
  return {
    collectionName: useState(""),
    filesContent: useState<DBImage[]>([]),
    selectedPreview: useState<SelectedPreview>({
      name: "",
      blobURL: "",
    }),
    zones: useState<Zones>({
      zones: [],
      inProgressZone: null,
    }),
    selectedZone: useState<number | null>(null),
  };
}
