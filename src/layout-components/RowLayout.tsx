import styled from "styled-components";

export const RowLayout = styled.div<{
  $height?: string;
  $proportions?: string;
}>`
  display: grid;
  grid-auto-flow: row;
  ${(props) =>
    props.$proportions
      ? "grid-template-rows: " + props.$proportions + ";"
      : "grid-auto-rows: minmax(0, 1fr);"}
  justify-items: center;
  row-gap: 10px;

  padding: 10px;
  border: 1px solid;

  width: 100%;
  ${(props) => (props.$height ? "height: " + props.$height + ";" : "")}
  min-height: 0;
  box-sizing: border-box;
`;

export const RowFlexLayout = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;

  border: 1px solid;
  padding: 0 0.5em;

  box-sizing: border-box;
  width: 100%;
`;
