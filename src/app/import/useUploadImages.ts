import { fileTypeFromBuffer } from 'file-type';
import { useState } from 'react';
import { useFilePicker } from 'use-file-picker';
import { FileContent } from 'use-file-picker/types';
import { unzipImages } from '../util/zip';
import { ImageImportConfigType } from './types';

export function useUploadImages(defaultSettings: ImageImportConfigType) {
  const [processedFilesContent, setProcessedFilesContent] = useState<
    FileContent<ArrayBuffer>[]
  >([]);
  // TODO handle loading state and errors
  const { openFilePicker } = useFilePicker({
    readAs: 'ArrayBuffer',
    accept: ['.avif', 'image/*', '.zip', '.cbz'],
    multiple: true,
    onFilesSuccessfullySelected: async ({ plainFiles, filesContent }) => {
      let newProcessedFiles: FileContent<ArrayBuffer>[] = [];
      for (const fileContent of filesContent) {
        const fileType = await fileTypeFromBuffer(fileContent.content);
        if (fileType?.ext === 'zip') {
          newProcessedFiles = newProcessedFiles.concat(
            await unzipImages(fileContent.name, fileContent.content)
          );
        } else if (fileType?.mime.includes('image')) {
          newProcessedFiles.push(fileContent);
        }
      }
      setProcessedFilesContent(newProcessedFiles);
    },
  });
  const [settings, setSettings] =
    useState<ImageImportConfigType>(defaultSettings);

  return {
    openFilePicker,
    filesContent: processedFilesContent,
    settings,
    setSettings,
  };
}
