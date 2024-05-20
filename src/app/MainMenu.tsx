import { Link } from 'react-router-dom';
import { deleteCollection, useCollectionNamesLocalStorage } from './storage';
import { useContext } from 'react';
import { WorkerContext } from './AlignerWorker';
import { useAuth } from 'react-oidc-context';

export function MainMenu({ ...rest }) {
  const dropBoxAuth = useAuth();
  const { collections: collectionNames, refresh: refreshCollectionNames } =
    useCollectionNamesLocalStorage();
  const { setNeeded, inProgress, setInProgress } = useContext(WorkerContext);

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
        </div>
      ))}
    </>
  );
}
