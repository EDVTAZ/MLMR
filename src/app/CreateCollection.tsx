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

function useImportImages() {
  // TODO handle loading state and errors
  const { openFilePicker, filesContent } = useFilePicker({
    readAs: 'ArrayBuffer',
    accept: 'image/*',
    multiple: true,
  });
  const [settings, setSettings] = useState<ImageImportConfigType>({
    resize: 2000000,
    do_split: true,
    do_crop: true,
    right2left: true,
  });

  return { openFilePicker, filesContent, settings, setSettings };
}

type ImportImagesProps = {
  openFilePicker: () => void;
  settings: ImageImportConfigType;
  setSettings: Dispatch<SetStateAction<ImageImportConfigType>>;
};

function ImportImages({
  openFilePicker,
  settings,
  setSettings,
}: ImportImagesProps) {
  const id = useId();
  return (
    <div>
      <button onClick={openFilePicker}>Import images</button>
      <label htmlFor={`resize-to${id}`}>{' | Resize:'}</label>
      <input
        id={`resize-to${id}`}
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
      />
      <input
        id={`do-crop${id}`}
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
      />
      <label htmlFor={`do-crop${id}`}>{'Crop pages]'}</label>
      <input
        id={`do-split${id}`}
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
      />
      <label htmlFor={`do-split${id}`}>{'Split double pages]'}</label>
      <input
        id={`right-to-left${id}`}
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
      />
      <label htmlFor={`right-to-left${id}`}>
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
  const { worker, setNeeded } = useContext(WorkerContext);
  const navigate = useNavigate();

  useEffect(() => {
    setNeeded(true);
  }, []);

  useEffect(() => {
    if (!worker) return;
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'orig-written' || data['msg'] === 'transl-written') {
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
      <ImportImages
        openFilePicker={openFilePickerOrig}
        settings={settingsOrig}
        setSettings={setSettingsOrig}
      />
      <ImportImages
        openFilePicker={openFilePickerTransl}
        settings={settingsTransl}
        setSettings={setSettingsTransl}
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
      />
      {filesContentOrig.length > 0 && filesContentTransl.length > 0 && (
        <>
          <div>{`Loaded ${filesContentOrig.length}+${filesContentTransl.length} images!`}</div>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              startAlignment(
                worker,
                collectionName,
                filesContentOrig,
                settingsOrig,
                filesContentTransl,
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
            />
            <button>{'Start'}</button>
          </form>
        </>
      )}
      <Link to={'/'}>
        <button>Back to home</button>
      </Link>
    </>
  );
}
