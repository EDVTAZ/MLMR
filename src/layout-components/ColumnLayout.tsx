import styled from "styled-components";

export const ColumnLayout = styled.div<{
  $height?: string;
  $proportions?: string;
}>`
  display: grid;
  grid-auto-flow: column;
  ${(props) =>
    props.$proportions
      ? "grid-template-columns: " + props.$proportions + ";"
      : "grid-auto-columns: minmax(0, 1fr);"}
  justify-content: center;

  padding: 10px
  box-sizing: border-box;

  height: ${(props) => (props.$height ? props.$height : "100vh")};
  min-height: 0;
  width: 100%;
  column-gap: 10px;
`;
