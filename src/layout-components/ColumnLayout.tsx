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
      : "grid-auto-columns: 1fr;"}
  justify-items: center;

  height: ${(props) => (props.$height ? props.$height : "100vh")};
  width: 100%;
  column-gap: 1%;
`;
