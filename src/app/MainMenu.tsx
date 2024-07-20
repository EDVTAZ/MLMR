import { Button, Divider, Flex, Spacer, VStack } from '@chakra-ui/react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WorkerContext } from './aligner-worker/AlignerWorker';
import { deleteCollection } from './util/storage';
import { useCollectionNamesLocalStorage } from './util/useLocalStorage';
import { useSetTitle } from './util/useSetTitle';

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
      <Link to={'/import'}>
        <Button id="import-button" border="solid">
          {'Import new collection'}
        </Button>
      </Link>
      <Divider />
      {collectionNames.map((collectionName) => (
        <Flex key={collectionName} w="80%" border="solid">
          <Link to={`/read/${collectionName}`}>
            <Button>{`Read ${collectionName}`}</Button>
          </Link>
          <Spacer></Spacer>
          <Button
            onClick={() => {
              deleteCollectionClick(collectionName);
            }}
          >{`X`}</Button>
        </Flex>
      ))}
    </VStack>
  );
}
