import { useEffect, useState } from "react";
import styled from "styled-components";
import { getLSPairingInfo, setCurrentPage } from "../../storage";
import { LocalStoragReadingPair, ReaderPosition } from "../../types";
import { StyledReaderImage } from "./ReaderImage";

function Reader({ pairingName, ...rest }: { pairingName: string }) {
  const [offset, setOffset] = useState(0);
  const [pairing, setPairing] = useState<LocalStoragReadingPair | null>(null);
  const [position, setPosition] = useState<ReaderPosition>({
    count: -1,
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
    const nonStatePairing = getLSPairingInfo(
      pairingName
    ) as LocalStoragReadingPair; // TDOOD

    setPairing(nonStatePairing);

    const hashPosition = parseInt(location.hash.slice(1));
    setPosition({
      count: hashPosition ? hashPosition : nonStatePairing.position,
      scroll: "start",
    });
  }, [pairingName]);

  useEffect(() => {
    function keyPressHandler(ev: KeyboardEvent) {
      if (ev.key === "ArrowLeft" || ev.key === "a") step(1);
      else if (ev.key === "ArrowRight" || ev.key === "d") step(-1);
      else if (ev.key === "v") setVersion((v) => (v + 1) % 2);
      else if (ev.key === "+") setZoom((z) => Math.min(z + 10, 100));
      else if (ev.key === "-") setZoom((z) => Math.max(z - 10, 10));
      else if (ev.key === "i") setOffset((o) => o + 1);
      else if (ev.key === "o") setOffset((o) => o - 1);
      else return;
      ev.preventDefault();
    }
    document.addEventListener("keydown", keyPressHandler);
    return () => {
      document.removeEventListener("keydown", keyPressHandler);
    };
  }, []);

  useEffect(() => {
    if (pairing && position.count >= 0) {
      setCurrentPage(pairing.name, position.count);
    }
  }, [pairing, position.count]);

  useEffect(() => {
    if (position.count >= 0) {
      history.pushState(null, "", `#${position.count}`);
    }
  }, [position.count]);

  useEffect(() => {
    const hashChangedHandler = (event: HashChangeEvent) => {
      const hashPosition = parseInt(new URL(event.newURL).hash.slice(1));
      if (hashPosition) {
        console.log(hashPosition);
        setPosition({
          count: hashPosition,
          scroll: "start",
        });
      }
    };

    addEventListener("hashchange", hashChangedHandler);
    return () => {
      removeEventListener("hashchange", hashChangedHandler);
    };
  }, []);

  return (
    <div {...rest}>
      {pairing && position.count >= 0 && (
        <>
          <StyledReaderImage
            collectionNames={pairing.collections}
            zoness={pairing.zoness}
            position={position}
            offset={offset}
            zoom={zoom / 100}
            version={version}
          />
          <div className="base-navigation">
            <div className="side-navigation" onClick={() => step(1)} />
            <div className="side-navigation" onClick={() => step(-1)} />
          </div>
        </>
      )}
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
