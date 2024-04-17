import { Link } from 'react-router-dom';
import { useCollectionNamesLocalStorage } from './storage';

export function MainMenu({ ...rest }) {
  const collectionNames = useCollectionNamesLocalStorage();

  return (
    <>
      <Link to={'/import'}>
        <button>{'Import new collection'}</button>
      </Link>
      {collectionNames.map((collectionName) => (
        <Link to={`/read/${collectionName}`} key={collectionName}>
          <button>{`Read ${collectionName}`}</button>
        </Link>
      ))}
    </>
  );
}
