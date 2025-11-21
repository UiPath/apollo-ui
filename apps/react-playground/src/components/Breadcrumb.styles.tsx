import { Link } from "react-router-dom";
import styled from "styled-components";

export const BreadcrumbContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const BreadcrumbInner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const HamburgerButton = styled.button`
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--color-background-hover);
  }
`;

export const HamburgerLine = styled.div`
  width: 20px;
  height: 2px;
  background: var(--color-foreground-emp);
  border-radius: 2px;
`;

export const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

export const BreadcrumbLink = styled(Link)<{ $isActive?: boolean }>`
  color: ${(props) => (props.$isActive ? "var(--color-foreground-emp)" : "var(--color-primary)")};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: ${(props) => (props.$isActive ? "none" : "underline")};
  }
`;

export const BreadcrumbItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const BreadcrumbSeparator = styled.span`
  color: var(--color-foreground);
`;

export const BreadcrumbText = styled.span`
  color: var(--color-foreground-emp);
  font-weight: 500;
`;
