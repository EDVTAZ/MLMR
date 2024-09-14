import { Card } from '@chakra-ui/react';
import { percentFormat } from '../util/percent-format';
import { ProgressBar } from './ProgressBar';

type PositionInfoProps = {
  currentPage: { page: number; percentage: number };
  pageCount: number | null;
  toggleSettings: () => void;
};

export function PositionInfo({
  currentPage,
  pageCount,
  toggleSettings,
}: PositionInfoProps) {
  return (
    <Card
      onClick={(ev) => {
        toggleSettings();
        ev.preventDefault();
        return false;
      }}
      style={{
        position: 'fixed',
        left: '2px',
        bottom: '2px',
        zIndex: 2,
        overflow: 'hidden',
        opacity: 0.75,
      }}
    >
      <ProgressBar
        text={`${currentPage.page + 1} / ${pageCount ?? 0}`}
        value={(currentPage.page + 1) / (pageCount ?? 1)}
        barPosition="top"
      />
      <ProgressBar
        text={percentFormat(currentPage.percentage)}
        value={currentPage.percentage}
        barPosition="bottom"
      />
      <div
        id="page-counter"
        style={{
          position: 'fixed',
          height: '100%',
          opacity: 0,
        }}
      >
        {`${currentPage.page + 1} / ${pageCount ?? 0}`}
      </div>
    </Card>
  );
}
