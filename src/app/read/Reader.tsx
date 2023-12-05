import { useEffect, useState } from "react";
import styled from "styled-components";
import { StyledReaderImage } from "./ReaderImage";
import { LocalStoragReadingPair, ReaderPosition } from "../../types";
import { getCurrentPage, getLSPairingInfo } from "../../storage";

function Reader({ pairingName, ...rest }: { pairingName: string }) {
  const nonStatePairing = getLSPairingInfo(
    pairingName
  ) as LocalStoragReadingPair; // TDOOD
  const [pairing, setPairing] = useState(nonStatePairing);
  const [position, setPosition] = useState<ReaderPosition>({
    count: nonStatePairing.position,
    scroll: "start",
  });
  const [zoom, setZoom] = useState(100);
  const [version, setVersion] = useState(0);

  function step(count: number) {
    setPosition((prev) => {
      return {
        count: Math.max(prev.count + count, 0),
        scroll: count > 0 ? "start" : "end",
      };
    });
  }

  useEffect(() => {
    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.key === "ArrowLeft" || ev.key === "a") step(1);
      else if (ev.key === "ArrowRight" || ev.key === "d") step(-1);
      else if (ev.key === "v") setVersion((v) => (v + 1) % 2);
      else if (ev.key === "+") setZoom((z) => Math.min(z + 10, 100));
      else if (ev.key === "-") setZoom((z) => Math.max(z - 10, 10));
      else return;
      ev.preventDefault();
    }
    document.addEventListener("keydown", keyPressHandler);
    return () => {
      document.removeEventListener("keydown", keyPressHandler);
    };
  }, []);

  return (
    <div {...rest}>
      <StyledReaderImage
        collectionNames={pairing.collections}
        zoness={pairing.zoness}
        position={position}
        zoom={zoom / 100}
        version={version}
      />
      <div className="base-navigation">
        <div className="side-navigation" onClick={() => step(1)} />
        <div className="side-navigation" onClick={() => step(-1)} />
      </div>
    </div>
  );
}
export default styled(Reader)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  .base-navigation {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
  }

  .side-navigation {
    height: 100%;
    width: 50%;
    background-color: transparent;
    border: 0;
  }
`;
