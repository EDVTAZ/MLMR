import { AuthProvider, AuthProviderProps, useAuth } from 'react-oidc-context';
import { useCollectionNamesLocalStorage } from './storage';
import { useEffect, useState } from 'react';
import {
  createFolderDropBox,
  deleteDropBox,
  listFolderDropBox,
  uploadFolderDropBox,
} from './dropbox-api';

const authConfig: AuthProviderProps = {
  authority: 'https://www.dropbox.com',
  client_id: '5uv84280kefln5c',
  redirect_uri: 'http://localhost:4200/',
  onSigninCallback: () => {
    window.history.pushState({}, '', 'http://localhost:4200/');
  },
  scope:
    'account_info.read files.metadata.read files.metadata.write files.content.read files.content.write',
};

type DropBoxButtonProps = {
  collectionName: string;
  authenticated: boolean;
  accessToken: undefined | string;
  refresh: number;
};

function useDropBoxIsUploaded(
  collectionName: string,
  accessToken: string,
  refresh: number
) {
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    listFolderDropBox(`/${collectionName}`, accessToken ?? '').then(
      (entries: string[]) => setUploaded(entries.length > 0)
    );
  }, [accessToken, collectionName, refresh]);

  return uploaded;
}

function DropBoxUploadButton({
  collectionName,
  authenticated,
  accessToken,
  refresh,
}: DropBoxButtonProps) {
  const [inProgress, setInProgress] = useState(false);
  const uploaded = useDropBoxIsUploaded(
    collectionName,
    accessToken ?? '',
    refresh
  );

  return (
    <button
      onClick={async () => {
        if (!accessToken) return;
        setInProgress(true);
        await createFolderDropBox(`/${collectionName}`, accessToken);
        await createFolderDropBox(`/${collectionName}/orig`, accessToken);
        await createFolderDropBox(`/${collectionName}/transl`, accessToken);
        uploadFolderDropBox(collectionName, 'orig', accessToken);
        uploadFolderDropBox(collectionName, 'transl', accessToken);
        setInProgress(false); // not accurate, uploads started but may be in progress
      }}
      disabled={!authenticated || inProgress || uploaded}
    >{`Upload`}</button>
  );
}

function DropBoxDeleteButton({
  collectionName,
  authenticated,
  accessToken,
  refresh,
}: DropBoxButtonProps) {
  const [inProgress, setInProgress] = useState(false);
  const uploaded = useDropBoxIsUploaded(
    collectionName,
    accessToken ?? '',
    refresh
  );

  return (
    <button
      onClick={async () => {
        if (!accessToken) return;
        setInProgress(true);
        await deleteDropBox(`/${collectionName}`, accessToken);
        setInProgress(false);
      }}
      disabled={!authenticated || inProgress || !uploaded}
    >{`Delete from DropBox`}</button>
  );
}

export function DropBoxSyncPage() {
  const dropBoxAuth = useAuth();
  const { collections: collectionNames, refresh: refreshCollectionNames } =
    useCollectionNamesLocalStorage();
  const [dropBoxRefresh, setDropBoxRefresh] = useState(0);

  // useEffect(() => {
  //   // TODO proper solution for updating dropbox buttons instead of polling...
  //   if (dropBoxAuth.isAuthenticated) {
  //     const token = setInterval(
  //       () => setDropBoxRefresh((prev) => (prev + 1) % 10),
  //       10000
  //     );
  //     return () => clearInterval(token);
  //   }
  // }, [dropBoxAuth.isAuthenticated]);

  return (
    <AuthProvider {...authConfig}>
      <button
        onClick={() => {
          dropBoxAuth.signinRedirect();
        }}
        disabled={dropBoxAuth.isAuthenticated}
      >
        Log in with DropBox
      </button>
      <hr />
      {collectionNames.map((collectionName) => (
        <div key={collectionName}>
          <DropBoxUploadButton
            collectionName={collectionName}
            authenticated={dropBoxAuth.isAuthenticated}
            accessToken={dropBoxAuth.user?.access_token}
            refresh={dropBoxRefresh}
          />
          <DropBoxDeleteButton
            collectionName={collectionName}
            authenticated={dropBoxAuth.isAuthenticated}
            accessToken={dropBoxAuth.user?.access_token}
            refresh={dropBoxRefresh}
          />
        </div>
      ))}
    </AuthProvider>
  );
}
