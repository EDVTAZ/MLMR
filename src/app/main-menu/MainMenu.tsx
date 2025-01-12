import { CloseIcon, PlusSquareIcon, QuestionIcon } from '@chakra-ui/icons';
import { Button, Divider, HStack, VStack } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { deleteCollection } from '../util/storage';
import { useCollectionNamesLocalStorage } from '../util/useLocalStorage';
import { useSetTitle } from '../util/useSetTitle';
import { CollectionItem } from './CollectionItem';
import { Tutorial } from './Tutorial';

export function MainMenu() {
  const { collections: collectionNames, refresh: refreshCollectionNames } =
    useCollectionNamesLocalStorage();
  const [showTutorial, setShowTutorial] = useState(false);
  const { setNeeded, inProgress, setInProgress } = useContext(WorkerContext);

  useEffect(() => {
    if (collectionNames?.length === 0) setShowTutorial(true);
  }, [collectionNames]);

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
      <HStack wrap="wrap" justify="center">
        <Link to="/import">
          <Button id="import-button" leftIcon={<PlusSquareIcon />}>
            {'Import new collection'}
          </Button>
        </Link>
        <Button
          onClick={() => setShowTutorial((v) => !v)}
          variant={showTutorial ? 'outline' : 'solid'}
          leftIcon={showTutorial ? <CloseIcon /> : <QuestionIcon />}
        >
          {'Help'}
        </Button>
      </HStack>
      <Divider />
      {showTutorial && <Tutorial />}
      {collectionNames?.map((collectionName) => (
        <CollectionItem
          collectionName={collectionName}
          deleteCollectionClick={deleteCollectionClick}
          key={collectionName}
        />
      ))}
    </VStack>
  );
}
