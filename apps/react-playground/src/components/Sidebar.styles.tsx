import { Link } from "react-router-dom";
import styled from "styled-components";

// ─── Shell ────────────────────────────────────────────────────────────────────

export const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 220px;
  background: var(--color-background-raised);
  border-right: 1px solid var(--color-border-de-emp);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const SidebarNav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// ─── UiPath header ────────────────────────────────────────────────────────────

export const OrchestratorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 14px 11px;
  border-bottom: 1px solid var(--color-border-de-emp);
  flex-shrink: 0;
`;

export const OrchestratorLogo = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: var(--color-foreground-highlight);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
`;

export const OrchestratorTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-foreground-emp);
`;

// ─── Top fixed nav items ──────────────────────────────────────────────────────

export const TopNav = styled.div`
  padding: 6px 0 0;
  flex-shrink: 0;
`;

export const TopNavItem = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: ${({ $isActive }) =>
    $isActive ? "var(--color-background-selected)" : "transparent"};
  color: ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "var(--color-foreground-emp)"};
  font-size: 13px;
  font-weight: ${({ $isActive }) => ($isActive ? "600" : "500")};
  cursor: pointer;
  text-align: left;
  border-left: 3px solid ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "transparent"};
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: ${({ $isActive }) =>
      $isActive ? "var(--color-background-selected)" : "var(--color-background-hover)"};
  }
`;

export const TopNavIcon = styled.span`
  font-size: 14px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
`;

// ─── Folder search ────────────────────────────────────────────────────────────

export const FolderSearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 6px 10px 4px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 5px 9px;
  background: var(--color-background-edit);
  flex-shrink: 0;
`;

export const FolderSearchIcon = styled.span`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  flex-shrink: 0;
`;

export const FolderSearchInput = styled.input`
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--color-foreground);
  outline: none;
  width: 100%;
  &::placeholder { color: var(--color-foreground-de-emp); }
`;

// ─── Folder tree ─────────────────────────────────────────────────────────────

export const FolderTree = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2px 0 6px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
  }
`;

export const FolderItem = styled.button<{ $isActive: boolean; $depth?: number }>`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 5px 10px 5px ${({ $depth }) => 10 + ($depth ?? 0) * 14}px;
  border: none;
  background: ${({ $isActive }) =>
    $isActive ? "var(--color-background-selected)" : "transparent"};
  color: ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "var(--color-foreground)"};
  font-size: 12px;
  font-weight: ${({ $isActive }) => ($isActive ? "600" : "400")};
  cursor: pointer;
  text-align: left;
  border-left: 3px solid ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "transparent"};
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
  &:hover {
    background: ${({ $isActive }) =>
      $isActive ? "var(--color-background-selected)" : "var(--color-background-hover)"};
    color: ${({ $isActive }) =>
      $isActive ? "var(--color-primary)" : "var(--color-foreground-emp)"};
  }
`;

export const FolderChevron = styled.span<{ $expanded: boolean; $visible: boolean }>`
  font-size: 8px;
  color: var(--color-foreground-de-emp);
  width: 10px;
  flex-shrink: 0;
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  transform: rotate(${({ $expanded }) => ($expanded ? "90deg" : "0deg")});
  transition: transform 0.15s ease;
`;

export const FolderIcon = styled.span`
  font-size: 13px;
  flex-shrink: 0;
`;

export const FolderLabel = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ─── Divider ─────────────────────────────────────────────────────────────────

export const SidebarDivider = styled.div`
  height: 1px;
  background: var(--color-border-de-emp);
  margin: 4px 0;
  flex-shrink: 0;
`;

// ─── Prototypes section ───────────────────────────────────────────────────────

export const PrototypesSection = styled.div`
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-de-emp);
  padding: 4px 0 6px;
`;

export const PrototypesHeader = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "var(--color-foreground-emp)"};
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  text-align: left;
  transition: color 0.12s;
  &:hover { color: var(--color-foreground-emp); }
`;

export const PrototypesChevron = styled.span<{ $expanded: boolean }>`
  font-size: 9px;
  margin-left: auto;
  color: var(--color-foreground-de-emp);
  transform: rotate(${({ $expanded }) => ($expanded ? "0deg" : "-90deg")});
  transition: transform 0.15s ease;
`;

export const PrototypesLinks = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? "400px" : "0")};
  overflow: hidden;
  transition: max-height 0.2s ease;
`;

export const ProtoLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 30px;
  font-size: 12px;
  text-decoration: none;
  color: ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "var(--color-foreground-de-emp)"};
  font-weight: ${({ $isActive }) => ($isActive ? "600" : "400")};
  border-left: 3px solid ${({ $isActive }) =>
    $isActive ? "var(--color-primary)" : "transparent"};
  background: ${({ $isActive }) =>
    $isActive ? "var(--color-background-selected)" : "transparent"};
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground-emp);
  }
`;

// Keep these exports so nothing that imports them breaks
export const NavSection = styled.div``;
export const NavLink = styled(Link)<{ $isActive: boolean }>``;
export const NavIcon = styled.span``;
export const NavLabel = styled.span``;
export const ParentNavButton = styled.button<{ $isActive: boolean }>``;
export const ChevronIcon = styled.span<{ $isExpanded: boolean }>``;
export const SubNav = styled.div<{ $isExpanded: boolean }>``;
export const SubNavLink = styled(Link)<{ $isActive: boolean }>``;
