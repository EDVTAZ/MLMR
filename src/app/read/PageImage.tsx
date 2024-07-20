const baseImgStyle: React.CSSProperties = {
  userSelect: 'none',
  width: '100%',
  height: '100%',
  position: 'absolute',
  left: '0',
  top: '0',
};

function getZindexAndClip(
  show: boolean,
  peeking: boolean,
  mousePos: { x: number; y: number },
  elem: HTMLDivElement | null
): React.CSSProperties {
  const rv: React.CSSProperties = {
    zIndex: '1',
  };
  if (!show) {
    rv['zIndex'] = 0;
  }
  if (peeking && elem) {
    const rect = elem.getBoundingClientRect();
    const r = Math.floor(Math.min(rect.width, window.innerWidth) * 0.15);
    const left = mousePos.x - rect.left;
    const top = mousePos.y - r - rect.top;
    if (
      left > -r &&
      top > -r &&
      left < rect.width + r &&
      top < rect.height + r
    ) {
      if (!show) {
        rv['clipPath'] = `circle(${r}px at ${left}px ${top}px)`;
        rv['zIndex'] = 1;
      } else {
        rv['zIndex'] = 0;
      }
    }
  }
  return rv;
}

type PageImageProps = {
  src: string;
  active: boolean;
  peeking: boolean;
  mousePos: { x: number; y: number };
  parent: HTMLDivElement | null;
};

export function PageImage({
  src,
  active,
  peeking,
  mousePos,
  parent,
}: PageImageProps) {
  return (
    <img
      src={src}
      draggable={false}
      style={{
        ...baseImgStyle,
        ...getZindexAndClip(active, peeking, mousePos, parent),
      }}
      alt={'loading'}
    />
  );
}
