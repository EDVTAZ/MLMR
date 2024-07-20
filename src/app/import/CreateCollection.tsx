import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { startAlignment } from '../aligner-worker/start-alignment';
import {
  useLoadAlignerWorker,
  useRedirectToInProgressImport,
} from '../aligner-worker/useAlignerworker';
import { orderFiles } from '../util/filename-compare';
import { useSetTitle } from '../util/useSetTitle';
import { PageOrdering } from './PageOrdering';
import { ImageImportConfigType } from './types';
import { UploadImages } from './UploadImages';
import { useUploadImages } from './useUploadImages';

const defaultImportSettings: ImageImportConfigType = {
  resize: 2000000,
  do_split: true,
  do_crop: true,
  right2left: true,
};

export function CreateCollection() {
  const [collectionName, setCollectionName] = useState<string>('');
  const {
    openFilePicker: openFilePickerOrig,
    filesContent: filesContentOrig,
    setSettings: setSettingsOrig,
    settings: settingsOrig,
  } = useUploadImages(defaultImportSettings);
  const {
    openFilePicker: openFilePickerTransl,
    filesContent: filesContentTransl,
    setSettings: setSettingsTransl,
    settings: settingsTransl,
  } = useUploadImages(defaultImportSettings);
  const [origReorder, setOrigReorder] = useState<false | string>(false);
  const [translReorder, setTranslReorder] = useState<false | string>(false);
  const [orbCount, setOrbCount] = useState(10000);
  const [onlyOrig, setOnlyOrig] = useState(false);
  const { worker, inProgress, setInProgress } = useContext(WorkerContext);

  useSetTitle(`MLMR - Import`);

  useLoadAlignerWorker();
  useRedirectToInProgressImport(collectionName);

  return (
    <>
      {inProgress && (
        <div>{`Another alignment (${inProgress}) is already in progress, please wait until it finishes...`}</div>
      )}
      <UploadImages
        typeName={'original'}
        openFilePicker={openFilePickerOrig}
        settings={settingsOrig}
        setSettings={setSettingsOrig}
        idBase="orig"
        disabled={!!inProgress}
      />
      <UploadImages
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
          const orderedOrig = orderFiles(filesContentOrig, origReorder);
          const orderedTransl = onlyOrig
            ? []
            : orderFiles(filesContentTransl, translReorder);
          startAlignment(
            worker,
            collectionName,
            orderedOrig,
            settingsOrig,
            onlyOrig ? [] : orderedTransl,
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
