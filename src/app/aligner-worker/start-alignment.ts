import { FileContent } from 'use-file-picker/types';
import { ImageImportConfigType, StartImportType } from '../import/types';

export function startAlignment(
  worker: Worker | null,
  dirname: string,
  filesContentOrig: FileContent<ArrayBuffer>[],
  settingsOrig: ImageImportConfigType,
  filesContentTransl: FileContent<ArrayBuffer>[],
  settingsTransl: ImageImportConfigType,
  orbCount: number
) {
  if (!worker) return;

  const data: StartImportType = {
    cmd: 'start',
    name: dirname,
    orig_imgs: filesContentOrig,
    orig_settings: settingsOrig,
    transl_imgs: filesContentTransl,
    transl_settings: { ...settingsTransl, orb_count: orbCount },
  };
  worker.postMessage(
    data,
    filesContentOrig
      .map((file) => {
        return file.content;
      })
      .concat(
        filesContentTransl.map((file) => {
          return file.content;
        })
      )
  );
}
