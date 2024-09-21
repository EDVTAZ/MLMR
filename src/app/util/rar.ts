import { createExtractorFromData } from 'node-unrar-js';
import { type FileContent } from 'use-file-picker/types';
import { stringCompare } from './filename-compare';

class rar {
  static #instance: rar;
  static wasmBinary: ArrayBuffer | undefined;
  constructor() {
    if (!rar.#instance) {
      rar.#instance = this;
    }
    return rar.#instance;
  }
  async getExtractor(data: ArrayBuffer) {
    if (!rar.wasmBinary) {
      rar.wasmBinary = await (await fetch('/unrar.wasm')).arrayBuffer();
    }
    return createExtractorFromData({ wasmBinary: rar.wasmBinary, data });
  }
}

export async function unrarImages(
  rarFilename: string,
  fileContent: ArrayBuffer
) {
  const rarExtractor = await new rar().getExtractor(fileContent);
  const extracted = rarExtractor.extract();

  const returnFiles: FileContent<ArrayBuffer>[] = []; //load the files
  for (const file of extracted.files) {
    if (file.extraction) {
      const fileContent: FileContent<ArrayBuffer> = {
        name: `${rarFilename}|${file.fileHeader.name}`,
        lastModified: Date.parse(file.fileHeader.time),
        content: file.extraction.buffer,
      };
      console.log(fileContent);
      returnFiles.push(fileContent);
    }
  }

  returnFiles.sort((a, b) => stringCompare(a.name, b.name));
  return returnFiles;
}
