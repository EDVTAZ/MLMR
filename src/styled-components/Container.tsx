import styled from "styled-components";

export const BoxContainer = styled.div<{
  $height?: string;
  $width?: string;
}>`
  border: 1px solid;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;

  width: ${(props) => props.$width ?? "100%"};
  min-width: 0;
  height: ${(props) => props.$height ?? "100%"};
  min-height: 0;
`;
