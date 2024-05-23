import { AuthProvider, AuthProviderProps, useAuth } from 'react-oidc-context';
import { useCollectionNamesLocalStorage } from './storage';
import { useEffect, useState } from 'react';
import {
  createFolderDropBox,
  deleteDropBox,
  listFolderDropBox,
  uploadFolderDropBox,
} from './dropbox-api';
import { AccessTokenEvents } from 'oidc-client-ts';

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
  refresh: () => void;
  uploaded: boolean;
};

function useDropBoxCollectionNames(accessToken: string) {
  const [dropBopxCollectionNames, setCollectionNames] = useState<string[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    listFolderDropBox(`/`, accessToken ?? '').then((entries: string[]) =>
      setCollectionNames(entries)
    );
  }, [accessToken, refresh]);

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
      disabled={!authenticated || inProgress || uploaded}
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

export function DropBoxSyncPage() {
  const dropBoxAuth = useAuth();
  const { collections: collectionNames } = useCollectionNamesLocalStorage();
  const { dropBopxCollectionNames, refresh } = useDropBoxCollectionNames(
    dropBoxAuth.user?.access_token ?? ''
  );

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
      {collectionNames.concat(dropBopxCollectionNames).map((collectionName) => (
        <div key={collectionName}>
          {`${
            dropBopxCollectionNames.includes(collectionName) ? '' : 'not '
          }uploaded // locally ${
            collectionNames.includes(collectionName) ? '' : 'not '
          }available`}
          <DropBoxUploadButton
            collectionName={collectionName}
            authenticated={dropBoxAuth.isAuthenticated}
            accessToken={dropBoxAuth.user?.access_token}
            uploaded={dropBopxCollectionNames.includes(collectionName)}
            refresh={refresh}
          />
          <DropBoxDeleteButton
            collectionName={collectionName}
            authenticated={dropBoxAuth.isAuthenticated}
            accessToken={dropBoxAuth.user?.access_token}
            uploaded={dropBopxCollectionNames.includes(collectionName)}
            refresh={refresh}
          />
        </div>
      ))}
    </AuthProvider>
  );
}
