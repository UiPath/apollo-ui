import styled from "styled-components";

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
`;

export const IconCard = styled.div`
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 32px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const IconInfo = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

export const IconName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 8px;
`;

export const IconValue = styled.code`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
`;

export const IconVisual = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100px;
  margin-bottom: 16px;
`;

export const IconCircle = styled.div<{ $size: string }>`
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: 50%;
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-sm);
`;

export const IconDimensions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: var(--color-foreground);
`;
