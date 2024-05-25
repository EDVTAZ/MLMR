import { Link } from 'react-router-dom';
import { deleteCollection, useCollectionNamesLocalStorage } from './storage';
import { useContext, useEffect, useState } from 'react';
import { WorkerContext } from './AlignerWorker';

export function MainMenu({ ...rest }) {
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
        <Link to={'/sync'}>
          <button id="sync-button">{'Synchronize collections'}</button>
        </Link>
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
