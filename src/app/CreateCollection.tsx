import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import { useFilePicker } from 'use-file-picker';
import { FileContent } from 'use-file-picker/types';
import { WorkerContext } from './AlignerWorker';
import { Link, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

type ImageImportConfigType = {
  resize: number;
  do_split: boolean;
  do_crop: boolean;
  right2left: boolean;
};

type StartImportType = {
  cmd: 'start';
  name: string;
  orig_imgs: FileContent<ArrayBuffer>[];
  orig_settings: ImageImportConfigType;
  transl_imgs: FileContent<ArrayBuffer>[];
  transl_settings: ImageImportConfigType & { orb_count: number };
};

function startAlignment(
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

export async function unzipImages(fileContent: ArrayBuffer) {
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(fileContent);
  const returnFiles: FileContent<ArrayBuffer>[] = [];
  for (const filename in zip.files) {
    const file = zip.files[filename];
    if (file.dir) continue;
    const inflatedFile: FileContent<ArrayBuffer> = {
      name: file.name,
      lastModified: file.date.getTime(),
      content: await file.async('arraybuffer'),
      //TODO handle type error (for now I'm more/less sure it won't cause problems...)
    };
    returnFiles.push(inflatedFile);
  }
  returnFiles.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return returnFiles;
}

function useImportImages() {
  const [processedFilesContent, setProcessedFilesContent] = useState<
    FileContent<ArrayBuffer>[]
  >([]);
  // TODO handle loading state and errors
  const { openFilePicker } = useFilePicker({
    readAs: 'ArrayBuffer',
    accept: ['.avif', 'image/*', '.zip', '.cbz'],
    multiple: true,
    onFilesSuccessfullySelected: async ({ plainFiles, filesContent }) => {
      // this callback is called when there were no validation errors
      let newProcessedFiles: FileContent<ArrayBuffer>[] = [];
      for (const fileContent of filesContent) {
        if (
          fileContent.name.endsWith('.zip') ||
          fileContent.name.endsWith('.cbz')
        ) {
          newProcessedFiles = newProcessedFiles.concat(
            await unzipImages(fileContent.content)
          );
        } else {
          newProcessedFiles.push(fileContent);
        }
      }
      setProcessedFilesContent(newProcessedFiles);
    },
  });
  const [settings, setSettings] = useState<ImageImportConfigType>({
    resize: 2000000,
    do_split: true,
    do_crop: true,
    right2left: true,
  });

  return {
    openFilePicker,
    filesContent: processedFilesContent,
    settings,
    setSettings,
  };
}

type ImportImagesProps = {
  typeName: 'original' | 'translation';
  openFilePicker: () => void;
  settings: ImageImportConfigType;
  setSettings: Dispatch<SetStateAction<ImageImportConfigType>>;
  idBase: string;
  disabled: boolean;
};

function ImportImages({
  typeName,
  openFilePicker,
  settings,
  setSettings,
  idBase,
  disabled,
}: ImportImagesProps) {
  return (
    <div>
      <button
        id={`upload-images-${idBase}`}
        onClick={openFilePicker}
        disabled={disabled}
      >
        Import {typeName}
      </button>
      <label htmlFor={`resize-to-${idBase}`}>{' | Resize:'}</label>
      <input
        id={`resize-to-${idBase}`}
        name="resizeTo"
        type="number"
        value={settings.resize}
        onInput={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              resize: parseInt((e.target as HTMLInputElement).value),
            };
          })
        }
        disabled={disabled}
      />
      <input
        id={`do-crop-${idBase}`}
        name="doCrop"
        type="checkbox"
        checked={settings.do_crop}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              do_crop: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`do-crop-${idBase}`}>{'Crop pages]'}</label>
      <input
        id={`do-split-${idBase}`}
        name="doSplit"
        type="checkbox"
        checked={settings.do_split}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              do_split: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`do-split-${idBase}`}>{'Split double pages]'}</label>
      <input
        id={`right-to-left-${idBase}`}
        name="rightToLeft"
        type="checkbox"
        checked={settings.right2left}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              right2left: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`right-to-left-${idBase}`}>
        {'Right to left if checked]'}
      </label>
    </div>
  );
}

export function CreateCollection({ ...rest }) {
  const [collectionName, setCollectionName] = useState<string>('');
  const {
    openFilePicker: openFilePickerOrig,
    filesContent: filesContentOrig,
    setSettings: setSettingsOrig,
    settings: settingsOrig,
  } = useImportImages();
  const {
    openFilePicker: openFilePickerTransl,
    filesContent: filesContentTransl,
    setSettings: setSettingsTransl,
    settings: settingsTransl,
  } = useImportImages();
  const [orbCount, setOrbCount] = useState(10000);
  const [onlyOrig, setOnlyOrig] = useState(false);
  const { worker, setNeeded, inProgress, setInProgress } =
    useContext(WorkerContext);
  const navigate = useNavigate();

  useEffect(() => {
    setNeeded(true);
  }, []);

  useEffect(() => {
    if (!worker) return;
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'orig-written') {
        localStorage[`${data['collectionName']}-orig`] = data['count'];
        navigate(`/read/${collectionName}`);
      }
    }
    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, collectionName]);

  return (
    <>
      {inProgress && (
        <div>{`Another alignment (${inProgress}) is already in progress, please wait until it finishes...`}</div>
      )}
      <ImportImages
        typeName={'original'}
        openFilePicker={openFilePickerOrig}
        settings={settingsOrig}
        setSettings={setSettingsOrig}
        idBase="orig"
        disabled={!!inProgress}
      />
      <ImportImages
        typeName={'translation'}
        openFilePicker={openFilePickerTransl}
        settings={settingsTransl}
        setSettings={setSettingsTransl}
        idBase="transl"
        disabled={!!inProgress || onlyOrig}
      />
      <label htmlFor="orb-count">ORB count</label>
      <input
        id="orb-count"
        name="orbCount"
        type="number"
        min="100"
        value={orbCount}
        onInput={(e) =>
          setOrbCount(parseInt((e.target as HTMLInputElement).value))
        }
        disabled={!!inProgress}
      />
      <input
        id={`only-orig`}
        name="onlyOrig"
        type="checkbox"
        checked={onlyOrig}
        onChange={(e) => setOnlyOrig(e.target.checked)}
        disabled={!!inProgress}
      />
      <label htmlFor={`only-orig`}>{'Only import originals]'}</label>
      <div>{`Loaded ${filesContentOrig.length}+${filesContentTransl.length} images!`}</div>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          setInProgress(collectionName);
          startAlignment(
            worker,
            collectionName,
            filesContentOrig,
            settingsOrig,
            onlyOrig ? [] : filesContentTransl,
            settingsTransl,
            orbCount
          );
        }}
      >
        <label htmlFor="collection-name">{'Collection Name:'}</label>
        <input
          id="collection-name"
          name="collectionName"
          onInput={(e) =>
            setCollectionName((e.target as HTMLInputElement).value)
          }
          disabled={!!inProgress}
        />
        <button
          id={'start-import'}
          disabled={
            !!inProgress ||
            filesContentOrig.length <= 0 ||
            (filesContentTransl.length <= 0 && !onlyOrig) ||
            collectionName.length === 0
          }
        >
          {'Start'}
        </button>
      </form>
      <hr />
      <Link to={'/'}>
        <button>Back to home</button>
      </Link>
    </>
  );
}
