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

  width: 100%;
  ${(props) => (props.$height ? "height: " + props.$height + ";" : "")}
  min-height: 0;

  row-gap: 10px;

  border: 1px solid;

  padding: 10px;
  box-sizing: border-box;
`;
