export function SwitchPeek({ toggle }: { toggle: () => void }) {
  return (
    <div
      onClick={(ev) => {
        toggle();
        ev.preventDefault();
        return false;
      }}
      id="switch-peek"
      style={{
        position: 'fixed',
        right: '0px',
        bottom: '0px',
        maxWidth: '4vw',
        zIndex: 2,
      }}
    >
      Switch Peek
    </div>
  );
}
