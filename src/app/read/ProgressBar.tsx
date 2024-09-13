import { Card, Center, Progress } from '@chakra-ui/react';

export function ProgressBar({
  value,
  text,
  barPosition,
}: {
  value: number;
  text: string;
  barPosition: 'top' | 'bottom';
}) {
  return (
    <Card overflow="hidden">
      {barPosition === 'bottom' && <Center>{text}</Center>}
      <Progress colorScheme="gray" height="5px" value={value * 100} />
      {barPosition === 'top' && <Center>{text}</Center>}
    </Card>
  );
}
