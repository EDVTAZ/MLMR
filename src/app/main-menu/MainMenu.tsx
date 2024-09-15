import { PlusSquareIcon, QuestionIcon } from '@chakra-ui/icons';
import { Button, Divider, HStack, VStack } from '@chakra-ui/react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { deleteCollection } from '../util/storage';
import { useCollectionNamesLocalStorage } from '../util/useLocalStorage';
import { useSetTitle } from '../util/useSetTitle';
import { CollectionItem } from './CollectionItem';

export function MainMenu() {
  const { collections: collectionNames, refresh: refreshCollectionNames } =
    useCollectionNamesLocalStorage();
  const { setNeeded, inProgress, setInProgress } = useContext(WorkerContext);

  useSetTitle(`MLMR`);

  function deleteCollectionClick(collectionName: string) {
    if (inProgress === collectionName) {
      setNeeded(false);
      setInProgress(false);
    }
    deleteCollection(collectionName);
    refreshCollectionNames();
  }

  return (
    <VStack spacing={4} align="center" m="3%">
      <HStack>
        <Link to="/import">
          <Button id="import-button" leftIcon={<PlusSquareIcon />}>
            {'Import new collection'}
          </Button>
        </Link>
        <Link to="https://github.com/EDVTAZ/MLM-reader" target="blank">
          <Button leftIcon={<QuestionIcon />}>{'Help and source'}</Button>
        </Link>
      </HStack>
      <Divider />
      {collectionNames.map((collectionName) => (
        <CollectionItem
          collectionName={collectionName}
          deleteCollectionClick={deleteCollectionClick}
          key={collectionName}
        />
      ))}
    </VStack>
  );
}
