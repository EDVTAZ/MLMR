import { useEffect, useState } from "react";
import styled from "styled-components";
import { StyledReaderImage } from "./ReaderImage";
import { ReaderPosition } from "../types";

function Reader({ collectionNames, ...rest }: { collectionNames: string[] }) {
  const [position, setPosition] = useState<ReaderPosition>({
    count: 0,
    scroll: "start",
  });
  const [version, setVersion] = useState(1);

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
      else if (ev.key === "v") setVersion((v) => -v);
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
        collectionName={collectionNames[0]}
        position={position}
        visible={version === 1}
      />

      <StyledReaderImage
        collectionName={collectionNames[1]}
        position={position}
        visible={version === -1}
      />
      <div className="base-navigation">
        <div className="side-navigation" onClick={() => step(1)} />
        <div className="side-navigation" onClick={() => step(-1)} />
      </div>
    </div>
  );
}
export const StyledReader = styled(Reader)`
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
