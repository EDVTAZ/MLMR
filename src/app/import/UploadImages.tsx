import { QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  NumberInput,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { ImportImagesProps } from './types';

export function UploadImages({
  typeName,
  openFilePicker,
  settings,
  setSettings,
  idBase,
  disabled,
  children,
}: ImportImagesProps & PropsWithChildren) {
  return (
    <Card width="fit-content">
      <CardBody>
        <VStack alignItems="start">
          <Button
            id={`upload-images-${idBase}`}
            onClick={openFilePicker}
            disabled={disabled}
            width="100%"
          >
            Import {typeName}
          </Button>

          <Card width="100%">
            <CardBody>
              <VStack alignItems="start">
                <Checkbox
                  id={`do-crop-${idBase}`}
                  name="doCrop"
                  defaultChecked={settings.do_crop}
                  onChange={(e) =>
                    setSettings((prev) => {
                      return {
                        ...prev,
                        do_crop: e.target.checked,
                      };
                    })
                  }
                  disabled={disabled}
                >
                  Crop pages
                </Checkbox>
                <Checkbox
                  id={`do-split-${idBase}`}
                  name="doSplit"
                  defaultChecked={settings.do_split}
                  onChange={(e) =>
                    setSettings((prev) => {
                      return {
                        ...prev,
                        do_split: e.target.checked,
                      };
                    })
                  }
                  disabled={disabled}
                >
                  Split double pages
                </Checkbox>
                <Checkbox
                  id={`right-to-left-${idBase}`}
                  name="rightToLeft"
                  defaultChecked={settings.right2left}
                  onChange={(e) =>
                    setSettings((prev) => {
                      return {
                        ...prev,
                        right2left: e.target.checked,
                      };
                    })
                  }
                  disabled={disabled}
                >
                  Right to left if checked
                </Checkbox>
              </VStack>
            </CardBody>
          </Card>

          <InputGroup width="100%">
            <InputLeftAddon>Resize</InputLeftAddon>
            <Input
              id={`resize-to-${idBase}`}
              name="resizeTo"
              type="number"
              value={settings.resize}
              onChange={(e) =>
                setSettings((prev) => {
                  return {
                    ...prev,
                    resize: parseInt((e.target as HTMLInputElement).value),
                  };
                })
              }
              disabled={disabled}
            />
            <InputRightElement>
              <Tooltip label="Resolution of stored images in pixels, 0 for no resize. For good results it is recommended to resize images to similar sizes if the source doesn't guarantee this.">
                <QuestionOutlineIcon />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          <InputGroup width="100%">
            <InputLeftAddon>Color ε</InputLeftAddon>
            <NumberInput></NumberInput>
            <Input
              id={`resize-to-${idBase}`}
              name="colorEps"
              type="number"
              min="0"
              max="255"
              value={settings.color_eps}
              onChange={(e) =>
                setSettings((prev) => {
                  return {
                    ...prev,
                    color_eps: Math.min(
                      Math.max(
                        0,
                        parseInt((e.target as HTMLInputElement).value)
                      ),
                      255
                    ),
                  };
                })
              }
              disabled={disabled}
            />
            <InputRightElement>
              <Tooltip label="Epsilon value for decideing color equivalence when cropping and splitting images. If cropping or splitting is not agressive enough, increasing this value may help (e.g. by ignoring faint smudges on the edge of the scan.">
                <QuestionOutlineIcon />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          {children}
        </VStack>
      </CardBody>
    </Card>
  );
}
