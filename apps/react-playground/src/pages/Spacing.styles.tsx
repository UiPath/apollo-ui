import styled from "styled-components";

export const Section = styled.section<{ $marginBottom?: string }>`
  margin-bottom: ${(props) => props.$marginBottom || "0"};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

export const TokenCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
`;

export const TokenInfo = styled.div`
  margin-bottom: 16px;
`;

export const TokenName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 4px;
`;

export const TokenValue = styled.code`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
`;

export const SpacingDemo = styled.div<{ $gap: string }>`
  display: flex;
  align-items: center;
  gap: ${(props) => props.$gap};
  background: var(--color-background-hover);
  padding: 20px;
  border-radius: 8px;
`;

export const SpacingBox = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  background: ${(props) => props.$color};
  border-radius: 6px;
`;

export const SizeIndicator = styled.div<{ $size: string }>`
  margin-top: 12px;
  height: 20px;
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) ${(props) => props.$size},
    transparent ${(props) => props.$size}
  );
  border-radius: 4px;
  position: relative;
`;

export const SizeMarker = styled.div<{ $left: string }>`
  position: absolute;
  left: ${(props) => props.$left};
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background: var(--color-foreground-emp);
`;

export const PaddingDemo = styled.div`
  background: var(--color-background-hover);
  border-radius: 8px;
  overflow: hidden;
`;

export const PaddingOuter = styled.div<{ $padding: string }>`
  background: var(--color-background-selected);
  padding: ${(props) => props.$padding};
  border: 2px dashed var(--color-primary);
`;

export const PaddingInner = styled.div`
  background: var(--color-primary);
  color: var(--color-background);
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
`;
