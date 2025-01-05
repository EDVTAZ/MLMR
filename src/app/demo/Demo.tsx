import {
  LinkIcon,
  PlusSquareIcon,
  QuestionIcon,
  StarIcon,
} from '@chakra-ui/icons';
import {
  Button,
  Card,
  CardBody,
  Link as ChakraLink,
  Divider,
  HStack,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export function Demo() {
  return (
    <VStack spacing={4} align="center" m="3%">
      <HStack wrap="wrap" justify="center">
        <Link to="/import">
          <Button id="import-button" leftIcon={<PlusSquareIcon />}>
            {'Import new collection'}
          </Button>
        </Link>
        <Link
          to="https://github.com/EDVTAZ/MLMR/blob/master/README.md"
          target="blank"
        >
          <Button leftIcon={<QuestionIcon />}>{'Help and source'}</Button>
        </Link>
        <Link to="/demo">
          <Button leftIcon={<StarIcon />}>{'Demo'}</Button>
        </Link>
      </HStack>
      <Divider />
      <Card marginLeft="5%" marginRight="5%">
        <CardBody>
          <Stack spacing={3}>
            <Text>
              To start reading, you will need to load files from your
              filesystem. If you just want to try out the application, you can
              download and use the following two files:
            </Text>
            <UnorderedList>
              <ListItem>
                <ChakraLink href="/sayhello01jp.zip">
                  Say Hello to Black Jack - 01 - first 10 pages - japanese{' '}
                  <LinkIcon />
                </ChakraLink>
              </ListItem>
              <ListItem>
                <ChakraLink href="/sayhello01en.zip">
                  Say Hello to Black Jack - 01 - first 10 pages - english{' '}
                  <LinkIcon />
                </ChakraLink>
              </ListItem>
            </UnorderedList>
            <Text>
              Once you have the files, you can go to the "Import new collection"
              page and load one with the "Import original" and the other with
              the "Import translation" button. Finally choose a name and type it
              in the "Collection Name" field and click the "Start import"
              button. After a short delay the import should start and take you
              to the reading view where you can start reading the already
              imported parts.
            </Text>
            <Text>
              While the import is in progress there will be a progress display
              in the top right corner for both versions. Once it disappears the
              import is complete. The pages from the translation will be matched
              to the originals, minor differences in position and missing pages
              are detected, so everything should be properly aligned. You will
              be able to switch between languages with left click and peek at
              the translation in a circle above the cursor with right click.
            </Text>
            <Text>
              Clicking on the page counter in the bottom left brings up
              additional options. The slider controls zoom. The "Peek" button
              switches left and right mouse button behavior, this is useful for
              touchscreen where you can't right click.
            </Text>
            <Text>
              Additional controls:
              <UnorderedList>
                <ListItem>+/-: control zoom</ListItem>
                <ListItem>
                  {'<left arrow>'} or a: jump to top of previous page
                </ListItem>
                <ListItem>
                  {'<right arrow>'} or d: jump to top of next page
                </ListItem>
                <ListItem>n/m: control brightness and sepia filter</ListItem>
                <ListItem> v: switch language (same as left click)</ListItem>
              </UnorderedList>
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </VStack>
  );
}
