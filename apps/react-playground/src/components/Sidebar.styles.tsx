import { Link } from "react-router-dom";
import styled from "styled-components";

export const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  z-index: 1000;
  overflow-y: auto;
`;

export const SidebarNav = styled.nav`
  padding: 0;
`;

export const NavSection = styled.div``;

export const NavLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  text-decoration: none;
  color: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-foreground-emp)")};
  background: ${(props) => (props.$isActive ? "var(--color-background-selected)" : "transparent")};
  border-left: ${(props) =>
		props.$isActive
			? "4px solid var(--color-primary)"
			: "4px solid transparent"};
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
			props.$isActive
				? "var(--color-background-selected)"
				: "var(--color-background-hover)"};
  }
`;

export const NavIcon = styled.span`
  font-size: 16px;
`;

export const NavLabel = styled.span``;

export const SubNav = styled.div`
  padding-left: 20px;
`;

export const SubNavLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  padding: 8px 20px;
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
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
			props.$isActive
				? "var(--color-background-selected)"
				: "var(--color-background-hover)"};
    color: ${(props) => (props.$isActive ? "var(--color-primary)" : "var(--color-foreground-emp)")};
  }
`;
