import { useState } from "react";
import styled from "styled-components";
import { StyledReaderImage } from "./ReaderImage";

function Reader({ collectionNames, ...rest }: { collectionNames: string[] }) {
  const [position, setPosition] = useState(0);

  function step(count: number) {
    setPosition((prev) => {
      const newVal = Math.max(prev + count, 0);
      return newVal;
    });
  }

  return (
    <div {...rest}>
      <StyledReaderImage
        collectionName={collectionNames[0]}
        position={position}
        visible={true}
      />
      <div className="base-navigation">
        <button className="side-navigation" onClick={() => step(1)} />
        <button className="side-navigation" onClick={() => step(-1)} />
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
