import { AuthProvider, AuthProviderProps, useAuth } from 'react-oidc-context';
import { useCollectionNamesLocalStorage } from './storage';
import { useContext, useEffect, useState } from 'react';
import {
  createFolderDropBox,
  deleteDropBox,
  downloadFolderDropBox,
  listFolderDropBox,
  uploadFolderDropBox,
} from './dropbox-api';
import { WorkerContext } from './AlignerWorker';
import { Link } from 'react-router-dom';
import { FileContent } from 'use-file-picker/types';

type DirectImportMessageType = {
  cmd: 'direct-import';
  name: string;
  orig_imgs: FileContent<ArrayBuffer>[];
  transl_imgs: FileContent<ArrayBuffer>[];
};

const authConfig: AuthProviderProps = {
  authority: 'https://www.dropbox.com',
  client_id: '5uv84280kefln5c',
  redirect_uri: `${origin}/sync`,
  onSigninCallback: () => {
    window.history.pushState({}, '', `${origin}/sync`);
  },
  scope:
    'account_info.read files.metadata.read files.metadata.write files.content.read files.content.write',
};

type DropBoxButtonProps = {
  collectionName: string;
  authenticated: boolean;
  accessToken: undefined | string;
  refresh: () => void;
  uploaded: boolean;
  local?: boolean;
};

function useDropBoxCollectionNames() {
  const dropBoxAuth = useAuth();
  const [dropBopxCollectionNames, setCollectionNames] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (dropBoxAuth.isAuthenticated) {
      listFolderDropBox('', dropBoxAuth.user?.access_token ?? '').then(
        (entries: string[]) => setCollectionNames(entries)
      );
    }
  }, [dropBoxAuth.isAuthenticated, dropBoxAuth.user?.access_token, refresh]);

  return {
    dropBopxCollectionNames,
    refresh: () => {
      setRefresh((prev) => (prev + 1) % 10);
    },
  };
}

function DropBoxUploadButton({
  collectionName,
  authenticated,
  accessToken,
  refresh,
  uploaded,
  local,
}: DropBoxButtonProps) {
  const [inProgress, setInProgress] = useState(false);

  return (
    <button
      onClick={async () => {
        if (!accessToken) return;
        setInProgress(true);
        await createFolderDropBox(`/${collectionName}`, accessToken);
        await createFolderDropBox(`/${collectionName}/orig`, accessToken);
        await createFolderDropBox(`/${collectionName}/transl`, accessToken);
        await uploadFolderDropBox(collectionName, 'orig', accessToken);
        await uploadFolderDropBox(collectionName, 'transl', accessToken);
        refresh();
        setInProgress(false); // not accurate, uploads started but may be in progress
      }}
      disabled={!authenticated || inProgress || uploaded || !local}
    >{`Upload`}</button>
  );
}

function DropBoxDeleteButton({
  collectionName,
  authenticated,
  accessToken,
  refresh,
  uploaded,
}: DropBoxButtonProps) {
  const [inProgress, setInProgress] = useState(false);

  return (
    <button
      onClick={async () => {
        if (!accessToken) return;
        setInProgress(true);
        await deleteDropBox(`/${collectionName}`, accessToken);
        refresh();
        setInProgress(false);
      }}
      disabled={!authenticated || inProgress || !uploaded}
    >{`Delete from DropBox`}</button>
  );
}

function DropBoxDownloadButton({
  collectionName,
  authenticated,
  accessToken,
  refresh,
  uploaded,
  local,
}: DropBoxButtonProps) {
  const { worker, inProgress, setInProgress } = useContext(WorkerContext);

  return (
    <button
      onClick={async () => {
        if (!accessToken) return;
        setInProgress(collectionName);
        const orig_imgs = await downloadFolderDropBox(
          `/${collectionName}/orig`,
          accessToken
        );
        orig_imgs.forEach((e) => {
          e['name'] = e['name'].slice('orig/'.length);
        });
        const transl_imgs = await downloadFolderDropBox(
          `/${collectionName}/transl`,
          accessToken
        );
        transl_imgs.forEach((e) => {
          e['name'] = e['name'].slice('transl/'.length);
        });
        const msg: DirectImportMessageType = {
          cmd: 'direct-import',
          name: collectionName,
          orig_imgs,
          transl_imgs,
        };
        worker?.postMessage(
          msg,
          orig_imgs
            .map((file) => {
              return file.content;
            })
            .concat(
              transl_imgs.map((file) => {
                return file.content;
              })
            )
        );
        localStorage[`${collectionName}-orig`] = orig_imgs.length / 2;
      }}
      disabled={!authenticated || !uploaded || local || !!inProgress}
    >{`Download from DropBox`}</button>
  );
}

function DropBoxSyncPageInner() {
  const dropBoxAuth = useAuth();
  const { worker, setNeeded } = useContext(WorkerContext);
  const { collections: collectionNames, refresh: refreshLocal } =
    useCollectionNamesLocalStorage();
  const { dropBopxCollectionNames, refresh: refreshDropBox } =
    useDropBoxCollectionNames();

  useEffect(() => {
    setNeeded(true);
  }, []);

  useEffect(() => {
    if (!worker) return;
    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'done') {
        refreshLocal();
      }
    }
    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker]);

  return (
    <>
      <button
        onClick={() => {
          dropBoxAuth.signinRedirect();
        }}
        disabled={dropBoxAuth.isAuthenticated}
      >
        Log in with DropBox
      </button>
      <hr />
      {Array.from(new Set(collectionNames.concat(dropBopxCollectionNames))).map(
        (collectionName) => (
          <div key={collectionName}>
            {`${collectionName}: ${
              dropBopxCollectionNames.includes(collectionName) ? '' : 'not '
            }uploaded // locally ${
              collectionNames.includes(collectionName) ? '' : 'not '
            }available`}
            <DropBoxUploadButton
              collectionName={collectionName}
              authenticated={dropBoxAuth.isAuthenticated}
              accessToken={dropBoxAuth.user?.access_token}
              uploaded={dropBopxCollectionNames.includes(collectionName)}
              refresh={refreshDropBox}
              local={collectionNames.includes(collectionName)}
            />
            <DropBoxDownloadButton
              collectionName={collectionName}
              authenticated={dropBoxAuth.isAuthenticated}
              accessToken={dropBoxAuth.user?.access_token}
              uploaded={dropBopxCollectionNames.includes(collectionName)}
              refresh={refreshDropBox}
              local={collectionNames.includes(collectionName)}
            />
            <DropBoxDeleteButton
              collectionName={collectionName}
              authenticated={dropBoxAuth.isAuthenticated}
              accessToken={dropBoxAuth.user?.access_token}
              uploaded={dropBopxCollectionNames.includes(collectionName)}
              refresh={refreshDropBox}
            />
          </div>
        )
      )}
      <hr />
      <Link to={'/'}>
        <button>Back to home</button>
      </Link>
    </>
  );
}

export function DropBoxSyncPage() {
  return (
    <AuthProvider {...authConfig}>
      <DropBoxSyncPageInner />
    </AuthProvider>
  );
}
