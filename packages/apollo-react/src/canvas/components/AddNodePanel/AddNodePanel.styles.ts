import styled from "@emotion/styled";
import { motion } from "motion/react";

export const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 250px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-de-emp);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-border);
  }
`;

export const ListItemButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-background-hover);
  }
`;

export const IconContainer = styled.div<{ bgColor?: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.bgColor || "var(--color-background)"};
  border-radius: 8px;
  color: var(--color-foreground-emp);
  opacity: 0.9;
  flex-shrink: 0;
`;

export const AnimatedContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
`;

export const AnimatedContent = styled.div<{ entering?: boolean; direction?: "forward" | "back" }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: ${(props) => (props.entering ? `slideIn-${props.direction}` : "none")} 0.15s ease-out;
  min-height: 300px;

  @keyframes slideIn-forward {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideIn-back {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
