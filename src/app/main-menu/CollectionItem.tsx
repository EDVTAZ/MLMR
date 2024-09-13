import {
  ArrowRightIcon,
  CloseIcon,
  DeleteIcon,
  WarningTwoIcon,
} from '@chakra-ui/icons';
import { Button, Flex, Spacer } from '@chakra-ui/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function CollectionItem({
  collectionName,
  deleteCollectionClick,
}: {
  collectionName: string;
  deleteCollectionClick: (collectionName: string) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  return (
    <Flex key={collectionName} w="80%">
      {deleteConfirm ? (
        <Button
          colorScheme="red"
          leftIcon={<WarningTwoIcon />}
          onClick={() => deleteCollectionClick(collectionName)}
        >{`Click here to ${collectionName}!`}</Button>
      ) : (
        <Link to={`/read/${collectionName}`}>
          <Button leftIcon={<ArrowRightIcon />}>{collectionName}</Button>
        </Link>
      )}
      <Spacer />
      <Button
        onClick={() => {
          setDeleteConfirm((prev) => !prev);
        }}
      >
        {deleteConfirm ? <CloseIcon /> : <DeleteIcon />}
      </Button>
    </Flex>
  );
}
