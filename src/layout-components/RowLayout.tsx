import styled from "styled-components";

export const RowLayout = styled.div<{
  $height?: string;
}>`
  height: ${(props) => (props.$height ? props.$height : "100vh")};
  width: 100%;
  gap: 1%;
`;
