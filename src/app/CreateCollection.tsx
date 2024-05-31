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

function stringCompare(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

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
            await unzipImages(fileContent.name, fileContent.content)
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

function PageOrdering({
  type,
  files,
  reorder,
  setReorder,
}: {
  type: string;
  files: FileContent<ArrayBuffer>[];
  reorder: false | string;
  setReorder: Dispatch<SetStateAction<false | string>>;
}) {
  const orderedFiles = files.map((e) => e.name);
  if (reorder !== false) {
    orderedFiles.sort((a, b) => {
      try {
        const aGroups = a.match(reorder)?.groups;
        const bGroups = b.match(reorder)?.groups;

        if (!aGroups || !bGroups) return 0; //TODO

        for (let i = 0; `int${i}` in aGroups || `string${i}` in aGroups; ++i) {
          let comp = 0;
          if (`int${i}` in aGroups) {
            comp = parseInt(aGroups[`int${i}`]) - parseInt(bGroups[`int${i}`]);
          } else if (`string${i}` in aGroups) {
            comp = stringCompare(aGroups[`string${i}`], bGroups[`string${i}`]);
          }
          if (comp !== 0) return comp;
        }
        return 0; // tDOO
      } catch (e) {
        return 0; // TOIDO
      }
    });
  }

  return (
    <details>
      <summary>
        {type} file ordering: {reorder ? reorder.toString() : 'original'}
      </summary>
      <input
        onChange={(e) => {
          const val = (e.target as HTMLInputElement).value;
          setReorder(val.length > 0 ? val : false);
        }}
      />
      <ul>
        {orderedFiles.map((fileName) => (
          <li key={fileName}>{fileName}</li>
        ))}
      </ul>
    </details>
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
  const [origReorder, setOrigReorder] = useState<false | string>(false);
  const [translReorder, setTranslReorder] = useState<false | string>(false);
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
      <PageOrdering
        type={'orig'}
        files={filesContentOrig}
        reorder={origReorder}
        setReorder={setOrigReorder}
      />
      <PageOrdering
        type={'transl'}
        files={filesContentTransl}
        reorder={translReorder}
        setReorder={setTranslReorder}
      />
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          setInProgress(collectionName);
          // tODO order files
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
