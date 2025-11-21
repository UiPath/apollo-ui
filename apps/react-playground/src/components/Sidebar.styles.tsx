import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  z-index: 1500;
  animation: ${fadeIn} 0.3s ease;
`;

export const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-background);
  box-shadow: var(--shadow-2xl);
  z-index: 1600;
  transform: ${(props) => (props.$isOpen ? "translateX(0)" : "translateX(-100%)")};
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 80px 0 20px 0;
`;

export const SidebarNav = styled.nav``;

export const NavSection = styled.div``;

export const NavLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  text-decoration: none;
  color: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-foreground-emp)")};
  background: ${(props) => (props.$isActive ? "var(--color-background-selected)" : "transparent")};
  border-left: ${(props) =>
		props.$isActive
			? "4px solid var(--color-primary)"
			: "4px solid transparent"};
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
			props.$isActive
				? "var(--color-background-selected)"
				: "var(--color-background-hover)"};
  }
`;

export const NavIcon = styled.span`
  font-size: 20px;
`;

export const NavLabel = styled.span``;

export const SubNav = styled.div`
  padding-left: 20px;
`;

export const SubNavLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  padding: 10px 20px;
  text-decoration: none;
  color: ${(props) =>
		props.$isActive
			? "var(--color-primary)"
			: "var(--color-foreground-de-emp)"};
  background: ${(props) => (props.$isActive ? "var(--color-background-selected)" : "transparent")};
  border-left: ${(props) =>
		props.$isActive
			? "3px solid var(--color-primary)"
			: "3px solid transparent"};
  font-weight: ${(props) => (props.$isActive ? "600" : "400")};
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
			props.$isActive
				? "var(--color-background-selected)"
				: "var(--color-background-hover)"};
    color: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-foreground-emp)")};
  }
`;
