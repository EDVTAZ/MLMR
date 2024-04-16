import { useIDBImage } from './storage';

function getStyle(show: boolean): React.CSSProperties {
  const rv: React.CSSProperties = { width: '90vw', margin: '8px' };
  if (!show) {
    rv['position'] = 'absolute';
    rv['left'] = -100000;
    rv['top'] = -100000;
  }
  return rv;
}

export function Page({
  collectionName,
  index,
  language,
  ...rest
}: {
  collectionName: string;
  index: number;
  language: 'orig' | 'transl';
}) {
  const originalPage = useIDBImage(collectionName, 'out_orig', index);
  const translatedPage = useIDBImage(collectionName, 'out_transl', index);
  const effectiveLanguage = translatedPage === '' ? 'orig' : language;

  return (
    <>
      <img
        src={originalPage}
        style={getStyle(effectiveLanguage === 'orig')}
        key={'original'}
        alt={'loading'}
      />
      <img
        src={translatedPage}
        style={getStyle(effectiveLanguage === 'transl')}
        key={'translated'}
        alt={'loading'}
      />
    </>
  );
}
