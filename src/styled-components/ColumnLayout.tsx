import styled from "styled-components";

export const ColumnLayout = styled.div<{
  $height?: string;
  $proportions?: string;
  $noPadding?: boolean;
}>`
  display: grid;
  grid-auto-flow: column;
  ${(props) =>
    props.$proportions
      ? "grid-template-columns: " + props.$proportions + ";"
      : "grid-auto-columns: minmax(0, 1fr);"}
  justify-content: center;

  padding: ${(props) => (props.$noPadding ? "0" : "4%")};
  box-sizing: border-box;

  ${(props) => (props.$height ? "height: " + props.$height + ";" : "")}
  min-height: 0;
  width: 100%;
  column-gap: 2%;
`;
