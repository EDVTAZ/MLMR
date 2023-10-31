import styled from "styled-components";

export const ColumnLayout = styled.div<{ $height?: string }>`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  justify-items: center;

  height: ${(props) => (props.$height ? props.$height : "100vh")};
  width: 100%;
  gap: 1%;
`;
