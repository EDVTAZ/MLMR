import { LinkIcon } from '@chakra-ui/icons';
import {
  Card,
  CardBody,
  Link as ChakraLink,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react';

export function Tutorial() {
  return (
    <Card marginLeft="10%" marginRight="10%">
      <CardBody>
        <Stack spacing={3}>
          <Text>
            To start reading, you will need to load files from your filesystem.
            If you just want to try out the application, you can download and
            use the following two files:
          </Text>
          <UnorderedList>
            <ListItem>
              <ChakraLink href="/sayhello01jp.zip">
                Say Hello to Black Jack - 01 (sample) japanese <LinkIcon />
              </ChakraLink>
            </ListItem>
            <ListItem>
              <ChakraLink href="/sayhello01en.zip">
                Say Hello to Black Jack - 01 (sample) english <LinkIcon />
              </ChakraLink>
            </ListItem>
          </UnorderedList>
          <Text>
            Once you have the files, you can go to the "Import new collection"
            page and load one with the "Import original" and the other with the
            "Import translation" button. Finally choose a name and type it in
            the "Collection Name" field and click the "Start import" button.
            After a short delay the import should start and take you to the
            reading view where you can start reading the already imported parts.
          </Text>
          <Text>
            While the import is in progress there will be a progress display in
            the top right corner for both versions. Once it disappears the
            import is complete. The pages from the translation will be matched
            to the originals, minor differences in position and missing pages
            are detected, so everything should be properly aligned. You will be
            able to switch between languages with left click and peek at the
            translation in a circle above the cursor with right click.
          </Text>
          <Text>
            Clicking on the page counter in the bottom left brings up additional
            options. The slider controls zoom. The "Peek" button switches left
            and right mouse button behavior, this is useful for touchscreen
            where you can't right click.
          </Text>
          <Text as="div">
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
          <Text>
            More information and source code available here:{' '}
            <ChakraLink
              href="https://github.com/EDVTAZ/MLMR/blob/master/README.md"
              target="_blank"
            >
              GitHub <LinkIcon />
            </ChakraLink>
          </Text>
          <Text>Current version of the app: {__APP_VERSION__}</Text>
        </Stack>
      </CardBody>
    </Card>
  );
}
