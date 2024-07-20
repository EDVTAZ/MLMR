import { percentFormat } from '../util/percent-format';

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
    <div
      onClick={(ev) => {
        toggleSettings();
        ev.preventDefault();
        return false;
      }}
      id="page-counter"
      style={{
        position: 'fixed',
        left: '0px',
        bottom: '0px',
        maxWidth: '4vw',
        zIndex: 2,
      }}
    >
      {`${currentPage.page + 1} / ${pageCount ?? 0}`}
      <br />
      {percentFormat(currentPage.percentage)}
    </div>
  );
}
