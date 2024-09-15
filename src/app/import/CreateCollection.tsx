import { ArrowBackIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  Card,
  CardBody,
  Center,
  Checkbox,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Tag,
  Tooltip,
  Wrap,
} from '@chakra-ui/react';
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
        <Card width="100%">
          <CardBody>
            <Center>
              <Tag size="lg">
                {`Another alignment (${inProgress}) is already in progress, please wait until it finishes...`}
              </Tag>
            </Center>
          </CardBody>
        </Card>
      )}
      <Wrap>
        <Card width="100%">
          <CardBody>
            <Wrap>
              <Link to={'/'}>
                <Button>
                  <ArrowBackIcon />
                </Button>
              </Link>
              <InputGroup width="auto">
                <InputLeftAddon>Collection Name:</InputLeftAddon>
                <Input
                  id="collection-name"
                  name="collectionName"
                  onInput={(e) =>
                    setCollectionName((e.target as HTMLInputElement).value)
                  }
                  disabled={!!inProgress}
                />
              </InputGroup>

              <Checkbox
                id={`only-orig`}
                name="onlyOrig"
                defaultChecked={onlyOrig}
                onChange={(e) => setOnlyOrig(e.target.checked)}
                disabled={!!inProgress}
              >
                Only import originals
              </Checkbox>

              <InputGroup width="auto">
                <InputLeftAddon>ORB count:</InputLeftAddon>
                <Input
                  id="orb-count"
                  name="orbCount"
                  type="number"
                  min="100"
                  value={orbCount}
                  width="auto"
                  onInput={(e) =>
                    setOrbCount(parseInt((e.target as HTMLInputElement).value))
                  }
                  disabled={!!inProgress || onlyOrig}
                />
                <InputRightElement>
                  <Tooltip label="Number of ORBs used for matching images (higher is usually better matching but slower)">
                    <QuestionOutlineIcon />
                  </Tooltip>
                </InputRightElement>
              </InputGroup>
              <Button
                id={'start-import'}
                isDisabled={
                  !!inProgress ||
                  filesContentOrig.length <= 0 ||
                  (filesContentTransl.length <= 0 && !onlyOrig) ||
                  collectionName.length === 0
                }
                onClick={(ev) => {
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
                Start import
              </Button>
            </Wrap>
          </CardBody>
        </Card>
        <UploadImages
          typeName={'original'}
          openFilePicker={openFilePickerOrig}
          settings={settingsOrig}
          setSettings={setSettingsOrig}
          idBase="orig"
          disabled={!!inProgress}
        >
          <PageOrdering
            type={'orig'}
            files={filesContentOrig}
            reorder={origReorder}
            setReorder={setOrigReorder}
          />
        </UploadImages>
        {!onlyOrig && (
          <UploadImages
            typeName={'translation'}
            openFilePicker={openFilePickerTransl}
            settings={settingsTransl}
            setSettings={setSettingsTransl}
            idBase="transl"
            disabled={!!inProgress || onlyOrig}
          >
            <PageOrdering
              type={'transl'}
              files={filesContentTransl}
              reorder={translReorder}
              setReorder={setTranslReorder}
            />
          </UploadImages>
        )}
      </Wrap>
    </>
  );
}
