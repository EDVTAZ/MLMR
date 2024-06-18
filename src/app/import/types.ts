import { Dispatch, SetStateAction } from 'react';
import { FileContent } from 'use-file-picker/types';

export type ImageImportConfigType = {
  resize: number;
  do_split: boolean;
  do_crop: boolean;
  right2left: boolean;
};

export type StartImportType = {
  cmd: 'start';
  name: string;
  orig_imgs: FileContent<ArrayBuffer>[];
  orig_settings: ImageImportConfigType;
  transl_imgs: FileContent<ArrayBuffer>[];
  transl_settings: ImageImportConfigType & { orb_count: number };
};
export type ImportImagesProps = {
  typeName: 'original' | 'translation';
  openFilePicker: () => void;
  settings: ImageImportConfigType;
  setSettings: Dispatch<SetStateAction<ImageImportConfigType>>;
  idBase: string;
  disabled: boolean;
};
