import styled from "styled-components";

export const BoxContainer = styled.div<{
  $height?: string;
  $width?: string;
  $textAlign?: string;
  $noPadding?: boolean;
}>`
  border: 1px solid;
  padding: ${(props) => (props.$noPadding ? "0" : "4%")};
  box-sizing: border-box;
  text-align: ${(props) => props.$textAlign ?? "center"};

  width: ${(props) => props.$width ?? "100%"};
  min-width: 0;
  height: ${(props) => props.$height ?? "100%"};
  min-height: 0;
`;
