import { RepeatIcon } from '@chakra-ui/icons';
import { Button } from '@chakra-ui/react';

export function SwitchPeek({ toggle }: { toggle: () => void }) {
  return (
    <Button
      leftIcon={<RepeatIcon />}
      onClick={(ev) => {
        toggle();
        ev.preventDefault();
        return false;
      }}
      id="switch-peek"
    >
      Peek
    </Button>
  );
}
