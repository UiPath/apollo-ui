import styled from "@emotion/styled";
import { css } from "@emotion/react";

export const Container = styled.div<{ selected?: boolean }>`
  position: relative;
  width: 100px;
  height: 100px;
  background: var(--color-background);
  border: 1.5px solid var(--color-border-de-emp);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ selected }) =>
    selected &&
    css`
      border-color: var(--color-selection-indicator);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    `}

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

export const IconWrapper = styled.div`
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-secondary);
  border-radius: 8px;

  svg {
    width: 24px;
    height: 24px;
  }

  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
`;

export const TextContainer = styled.div<{ hasBottomHandles?: boolean }>`
  position: absolute;
  bottom: ${(props) => (props.hasBottomHandles ? "-40px" : "-8px")};
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
  color: var(--color-foreground);
  line-height: 1.4;
  margin-bottom: 2px;
  word-break: break-word;
`;

export const SubHeader = styled.div`
  font-size: 11px;
  color: var(--color-foreground-de-emp);
  line-height: 1.3;
  word-break: break-word;
`;

export const BadgeSlot = styled.div<{ position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  position: absolute;
  ${({ position }) => {
    switch (position) {
      case "top-left":
        return "top: 6px; left: 6px;";
      case "top-right":
        return "top: 6px; right: 6px;";
      case "bottom-left":
        return "bottom: 6px; left: 6px;";
      case "bottom-right":
        return "bottom: 6px; right: 6px;";
    }
  }}
`;
