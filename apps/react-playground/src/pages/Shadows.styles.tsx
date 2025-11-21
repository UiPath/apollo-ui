import styled from "styled-components";

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 40px;
`;

export const ShadowCardWrapper = styled.div`
  text-align: center;
`;

export const ShadowCard = styled.div<{ $shadowValue: string }>`
  background: var(--color-background);
  border-radius: 16px;
  padding: 40px;
  box-shadow: ${(props) => props.$shadowValue};
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-4px);
  }
`;

export const ShadowBox = styled.div<{ $shadowValue: string }>`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: ${(props) => props.$shadowValue};
`;

export const ShadowName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 12px;
`;

export const ShadowValue = styled.code`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  background: var(--color-background-hover);
  padding: 8px 12px;
  border-radius: 6px;
  word-break: break-all;
  max-width: 100%;
`;
