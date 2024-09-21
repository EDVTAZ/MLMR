import JSZip from 'jszip';
import { type FileContent } from 'use-file-picker/types';
import { stringCompare } from './filename-compare';

export async function unzipImages(
  zipFilename: string,
  fileContent: ArrayBuffer
) {
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(fileContent);
  const returnFiles: FileContent<ArrayBuffer>[] = [];
  for (const filename in zip.files) {
    const file = zip.files[filename];
    if (file.dir) continue;
    const inflatedFile: FileContent<ArrayBuffer> = {
      name: `${zipFilename}|${file.name}`,
      lastModified: file.date.getTime(),
      content: await file.async('arraybuffer'),
      //TODO handle type error (for now I'm more/less sure it won't cause problems...)
    };
    returnFiles.push(inflatedFile);
  }
  returnFiles.sort((a, b) => stringCompare(a.name, b.name));
  return returnFiles;
}
