import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const NodeContainer = styled.div<{ selected?: boolean }>`
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 16px;
  background: var(--uix-canvas-background);
  border: 1.5px solid var(--uix-canvas-border-de-emp);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--uix-canvas-selection-indicator);
      outline: 6px solid var(--uix-canvas-secondary-pressed);
    `}
`;

export const IconWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--uix-canvas-background-secondary);
  object-fit: contain;
`;

export const TextContainer = styled.div`
  position: absolute;
  bottom: -8px;
  width: 100%;
  transform: translateY(100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 10;
  transition: bottom 0.2s ease-in-out;
`;

export const Header = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: var(--uix-canvas-foreground);
  line-height: 1.4;
  margin-bottom: 2px;
  word-break: break-word;
`;
