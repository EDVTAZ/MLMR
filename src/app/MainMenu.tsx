import { Link } from 'react-router-dom';
import { deleteCollection, useCollectionNamesLocalStorage } from './storage';
import { useContext, useEffect, useState } from 'react';
import { WorkerContext } from './AlignerWorker';
import { useAuth } from 'react-oidc-context';
import {
  createFolderDropBox,
  deleteDropBox,
  listFolderDropBox,
  uploadFolderDropBox,
} from './dropbox-api';

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

export function MainMenu({ ...rest }) {
  const dropBoxAuth = useAuth();
  const { collections: collectionNames, refresh: refreshCollectionNames } =
    useCollectionNamesLocalStorage();
  const { setNeeded, inProgress, setInProgress } = useContext(WorkerContext);
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

  function deleteCollectionClick(collectionName: string) {
    if (inProgress === collectionName) {
      setNeeded(false);
      setInProgress(false);
    }
    deleteCollection(collectionName);
    refreshCollectionNames();
  }

  return (
    <>
      <div>
        <Link to={'/import'}>
          <button id="import-button">{'Import new collection'}</button>
        </Link>
        <hr />
        <button
          onClick={() => {
            dropBoxAuth.signinRedirect();
          }}
          disabled={dropBoxAuth.isAuthenticated}
        >
          Log in with DropBox
        </button>
        <hr />
      </div>
      {collectionNames.map((collectionName) => (
        <div key={collectionName}>
          <Link to={`/read/${collectionName}`}>
            <button>{`Read ${collectionName}`}</button>
          </Link>
          <button
            onClick={() => {
              deleteCollectionClick(collectionName);
            }}
          >{`X`}</button>
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
    </>
  );
}
