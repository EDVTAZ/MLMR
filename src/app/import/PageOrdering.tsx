import { QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  Card,
  CardBody,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  List,
  ListItem,
  Tag,
  Tooltip,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { FileContent } from 'use-file-picker/types';
import { getRegexComparer } from '../util/filename-compare';

export function PageOrdering({
  type,
  files,
  reorder,
  setReorder,
}: {
  type: string;
  files: FileContent<ArrayBuffer>[];
  reorder: false | string;
  setReorder: Dispatch<SetStateAction<false | string>>;
}) {
  const orderedFiles = files.map((e) => e.name);
  if (reorder !== false) {
    orderedFiles.sort(getRegexComparer(reorder));
  }

  return (
    <Card width="100%">
      <Tag size="lg">
        {files.length > 0
          ? `Loaded ${files.length} ${
              type === 'orig' ? 'original' : 'translated'
            } images!`
          : 'No files loaded!'}
      </Tag>
      {files.length > 0 && (
        <CardBody>
          <InputGroup width="100%">
            <InputLeftAddon>Order:</InputLeftAddon>
            <Input
              list="prepared-regexes"
              placeholder="original"
              onChange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setReorder(val.length > 0 && val !== 'original' ? val : false);
              }}
            />
            <InputRightElement>
              <Tooltip label="For keeping import order, leave empty or type 'original'. Otherwise a regex where groups named int<number> and string<number> will be used for ordering. int will be parsed as a number, string will be left as a string. The number in the group name will indicate priority, 0 for highest.">
                <QuestionOutlineIcon />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          <datalist id="prepared-regexes">
            <option value="original" />
            <option value="^(?<int0>[0-9]+)\.\w+$" label="numbered" />
            <option value="^(?<string0>.*)\.\w+$" label="string" />
          </datalist>
          <Card>
            <CardBody maxHeight="20vh" overflowY={'scroll'}>
              <List>
                {orderedFiles.map((fileName) => (
                  <ListItem key={fileName}>{fileName}</ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </CardBody>
      )}
    </Card>
  );
}
