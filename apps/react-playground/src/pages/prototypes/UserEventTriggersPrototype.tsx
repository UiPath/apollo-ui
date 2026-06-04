/**
 * Prototype: User Event Triggers
 *
 * Extends the Orchestrator Event Triggers grid so that triggers marked
 * "Configurable by users" can be expanded to reveal the per-user trigger
 * instances that each end-user has created using their own personal Connection.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UserTrigger {
  id: string;
  user: string;
  email: string;
  initials: string;
  connection: string;
  state: "enabled" | "disabled";
  lastRun: string;
}

interface EventTrigger {
  id: string;
  name: string;
  process: string;
  description: string;
  connectorIcon: string | null;
  connectorName: string | null;
  connection: string;
  configurableByUsers: boolean;
  jobPriority: string;
  type: "Connected" | "Disconnected";
  state: "active" | "inactive";
  userTriggers: UserTrigger[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_TRIGGERS: EventTrigger[] = [
  {
    id: "t1",
    name: "Agentic Process w multiple connectors",
    process: "Agentic Process w…",
    description: "",
    connectorIcon: null,
    connectorName: null,
    connection: "Configurable by users",
    configurableByUsers: true,
    jobPriority: "Inherited",
    type: "Connected",
    state: "active",
    userTriggers: [
      {
        id: "u1a",
        user: "Bogdan Doaga",
        email: "bogdan.doaga@uipath.com",
        initials: "BD",
        connection: "bogdan - Gdrive Personal",
        state: "enabled",
        lastRun: "2 min ago",
      },
      {
        id: "u1b",
        user: "Sorin Buse",
        email: "sorin.buse@uipath.com",
        initials: "SB",
        connection: "sorin - Gdrive Work",
        state: "disabled",
        lastRun: "Never",
      },
      {
        id: "u1c",
        user: "Paul Motiu",
        email: "paul.motiu@uipath.com",
        initials: "PM",
        connection: "paul - Gdrive Corp",
        state: "enabled",
        lastRun: "1 hour ago",
      },
    ],
  },
  {
    id: "t2",
    name: "Agentic Process w multiple connectors",
    process: "Agentic Process w…",
    description: "",
    connectorIcon: "🔵",
    connectorName: "Google Drive",
    connection: "bogdan - Gdrive P…",
    configurableByUsers: false,
    jobPriority: "Inherited",
    type: "Connected",
    state: "active",
    userTriggers: [],
  },
  {
    id: "t3",
    name: "Agentic Process w multiple connectors",
    process: "Agentic Process w…",
    description: "",
    connectorIcon: null,
    connectorName: null,
    connection: "Configurable by users",
    configurableByUsers: true,
    jobPriority: "Inherited",
    type: "Connected",
    state: "active",
    userTriggers: [
      {
        id: "u3a",
        user: "Bogdan Doaga",
        email: "bogdan.doaga@uipath.com",
        initials: "BD",
        connection: "bogdan - Slack Workspace",
        state: "enabled",
        lastRun: "5 hours ago",
      },
    ],
  },
  {
    id: "t4",
    name: "Invoice Automation",
    process: "Invoice Process",
    description: "Watches for new invoices",
    connectorIcon: "💬",
    connectorName: "Slack",
    connection: "configurable-slack",
    configurableByUsers: false,
    jobPriority: "Inherited",
    type: "Connected",
    state: "inactive",
    userTriggers: [],
  },
  {
    id: "t5",
    name: "Lead Scoring Agent",
    process: "Lead Scoring w…",
    description: "",
    connectorIcon: null,
    connectorName: null,
    connection: "Configurable by users",
    configurableByUsers: true,
    jobPriority: "High",
    type: "Connected",
    state: "active",
    userTriggers: [],
  },
];

const MENU_ITEMS = [
  "Edit in package requirements",
  "View jobs",
  "View history",
  "View traces",
  null, // divider
  "Enable",
  "Disable",
  null, // divider
  "Remove",
];

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const expandIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Page chrome
// ─────────────────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background);
  overflow: hidden;
`;

// Wraps the scrollable grid + annotation area
const ContentRow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  padding: 16px 28px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-bottom: 1px solid var(--color-border-de-emp);
  background: var(--color-background-raised);
`;

const BreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  margin-bottom: 12px;
`;

const BreadcrumbLink = styled.span`
  color: var(--color-foreground-link);
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const BreadcrumbSep = styled.span`
  font-size: 10px;
`;

const BreadcrumbCurrent = styled.span`
  color: var(--color-foreground);
  font-weight: 600;
`;

const PageNav = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: -1px;
`;

const NavTab = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? "var(--color-primary)" : "var(--color-foreground-de-emp)"};
  border-bottom: 2px solid ${({ $active }) =>
    $active ? "var(--color-primary)" : "transparent"};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  &:hover {
    color: ${({ $active }) =>
      $active ? "var(--color-primary)" : "var(--color-foreground)"};
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border-de-emp);
  flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 6px 11px;
  background: var(--color-background-edit);
  width: 220px;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-foreground);
  outline: none;
  width: 100%;
  &::placeholder { color: var(--color-foreground-de-emp); }
`;

const FilterChip = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background);
  font-size: 12px;
  color: var(--color-foreground);
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: var(--color-background-secondary); }
`;

const Spacer = styled.div`
  flex: 1;
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  border-radius: 5px;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: var(--color-primary-hover); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Grid
// ─────────────────────────────────────────────────────────────────────────────

const GridWrap = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0 16px 16px;
`;

const Grid = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const GridHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 2;
`;

const GridHeadRow = styled.tr`
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border-de-emp);
`;

const Th = styled.th<{ $width?: string; $align?: string }>`
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-foreground-de-emp);
  text-align: ${({ $align }) => $align ?? "left"};
  width: ${({ $width }) => $width ?? "auto"};
  white-space: nowrap;
  user-select: none;
`;

const SortIcon = styled.span`
  font-size: 9px;
  margin-left: 3px;
  opacity: 0.6;
`;

const GridBody = styled.tbody``;

const GridRow = styled.tr<{ $expanded: boolean; $configurable: boolean }>`
  border-bottom: 1px solid var(--color-border-de-emp);
  background: ${({ $expanded }) =>
    $expanded ? "var(--color-background-selected)" : "var(--color-background-raised)"};
  border-left: 3px solid ${({ $expanded }) =>
    $expanded ? "var(--color-primary)" : "transparent"};
  transition: background 0.12s, border-left-color 0.12s;
  &:hover {
    background: ${({ $expanded }) =>
      $expanded
        ? "var(--color-background-selected)"
        : "var(--color-background-hover)"};
  }
`;

const Td = styled.td<{ $width?: string }>`
  padding: 10px 12px;
  font-size: 13px;
  color: var(--color-foreground);
  vertical-align: middle;
  width: ${({ $width }) => $width ?? "auto"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckboxCell = styled(Td)`
  width: 36px;
  padding-left: 16px;
`;

const ExpandCell = styled(Td)`
  width: 32px;
  padding: 0;
`;

const ExpandBtn = styled.button<{ $expanded: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-primary);
  font-size: 11px;
  border-radius: 4px;
  transform: rotate(${({ $expanded }) => ($expanded ? "90deg" : "0deg")});
  transition: transform 0.18s ease;
  &:hover { background: var(--color-background-hover); }
`;

const TriggerName = styled.span`
  font-weight: 600;
  color: var(--color-foreground-emp);
  cursor: pointer;
  &:hover { color: var(--color-primary); text-decoration: underline; }
`;

const StatusDot = styled.span<{ $active: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active }) =>
    $active ? "var(--color-success-icon)" : "var(--color-border)"};
  margin-right: 6px;
`;

const ConnectorCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
`;

const ConnectorIcon = styled.span`
  font-size: 14px;
`;

const ConfigurableTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  font-style: italic;
`;

const UserCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  margin-left: 6px;
`;

const PriorityCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-foreground-de-emp);
`;

// ─────────────────────────────────────────────────────────────────────────────
// Row action menu
// ─────────────────────────────────────────────────────────────────────────────

const ActionCell = styled(Td)`
  width: 48px;
  text-align: right;
  overflow: visible;
`;

const MenuBtn = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground-de-emp);
  font-size: 16px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }
`;

// Rendered via a fixed portal overlay — escapes table overflow clipping
const DropMenu = styled.div<{ $top: number; $right: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  background: var(--color-background-raised);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  z-index: 9999;
  min-width: 210px;
  animation: ${fadeIn} 0.12s ease;
  padding: 4px 0;
`;

const MenuItem = styled.button<{ $danger?: boolean; $disabled?: boolean }>`
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  font-size: 13px;
  border: none;
  background: transparent;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  color: ${({ $danger, $disabled }) =>
    $disabled
      ? "var(--color-foreground-disable)"
      : $danger
        ? "var(--color-error-text)"
        : "var(--color-foreground)"};
  &:hover {
    background: ${({ $disabled }) =>
      $disabled ? "transparent" : "var(--color-background-secondary)"};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: var(--color-border-de-emp);
  margin: 4px 0;
`;

// ─────────────────────────────────────────────────────────────────────────────
// User sub-table
// ─────────────────────────────────────────────────────────────────────────────

const SubTableRow = styled.tr`
  animation: ${expandIn} 0.18s ease;
`;

const SubTableCell = styled.td`
  padding: 0;
  border-bottom: 1px solid var(--color-border-de-emp);
  background: var(--color-background-secondary);
`;

const SubTableWrap = styled.div`
  padding: 12px 16px 16px 52px;
  border-left: 3px solid var(--color-primary);
  background: var(--color-background-secondary);
`;

const SubTableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SubTableTitle = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: var(--color-foreground-de-emp);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const AddUserTriggerBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--color-primary);
  border-radius: 5px;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: var(--color-background-selected);
  }
`;

const SubTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const SubTh = styled.th<{ $width?: string }>`
  padding: 7px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-foreground-de-emp);
  text-align: left;
  border-bottom: 1px solid var(--color-border-de-emp);
  width: ${({ $width }) => $width ?? "auto"};
  white-space: nowrap;
`;

const SubTd = styled.td`
  padding: 9px 10px;
  font-size: 12px;
  color: var(--color-foreground);
  border-bottom: 1px solid var(--color-border-de-emp);
  vertical-align: middle;
`;

const SubTr = styled.tr`
  background: var(--color-background-raised);
  &:last-child td { border-bottom: none; }
  &:hover { background: var(--color-background-hover); }
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Avatar = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const UserName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-foreground-emp);
`;

const UserEmail = styled.span`
  font-size: 11px;
  color: var(--color-foreground-de-emp);
`;

const StateChip = styled.span<{ $state: "enabled" | "disabled" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $state }) =>
    $state === "enabled"
      ? "var(--color-success-background)"
      : "var(--color-chip-default-background)"};
  color: ${({ $state }) =>
    $state === "enabled"
      ? "var(--color-success-text)"
      : "var(--color-foreground-de-emp)"};
`;

const EmptyState = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-foreground-de-emp);
  font-size: 13px;
  background: var(--color-background-raised);
  border-radius: 6px;
  border: 1px dashed var(--color-border-de-emp);
`;

const EmptyStateIcon = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

const EmptyStateText = styled.div`
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 4px;
`;

const EmptyStateSub = styled.div`
  font-size: 12px;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 28px;
  border-top: 1px solid var(--color-border-de-emp);
  background: var(--color-background-raised);
  font-size: 12px;
  color: var(--color-foreground-de-emp);
`;

const PageBtn = styled.button`
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-border-de-emp);
  border-radius: 4px;
  background: var(--color-background);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-de-emp);
  &:disabled { opacity: 0.4; cursor: default; }
  &:not(:disabled):hover { background: var(--color-background-secondary); }
`;


// ─────────────────────────────────────────────────────────────────────────────
// Side panel
// ─────────────────────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

// Fixed overlay drawer — slides in from the right, never pushes the grid
const SidePanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border-de-emp);
  background: var(--color-background-raised);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.10);
  animation: ${slideIn} 0.18s ease;
  overflow: hidden;
  z-index: 200;
`;

const SPHeader = styled.div`
  padding: 14px 16px 0;
  border-bottom: 1px solid var(--color-border-de-emp);
  flex-shrink: 0;
`;

const SPTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
`;

const SPTitle = styled.h2`
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-foreground-emp);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
`;

const SPIconBtn = styled.button`
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground-de-emp);
  font-size: 14px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }
`;

const SPMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
`;

const SPMetaRow = styled.div`
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  display: flex;
  gap: 4px;
`;

const SPMetaLabel = styled.span`
  font-weight: 600;
  color: var(--color-foreground);
  min-width: 75px;
`;

const SPAuditLink = styled.a`
  font-size: 12px;
  color: var(--color-foreground-link);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  white-space: nowrap;
  align-self: flex-start;
  margin-top: 2px;
  &:hover { text-decoration: underline; }
`;

const SPTabRow = styled.div`
  display: flex;
  gap: 0;
`;

const SPTab = styled.button<{ $active: boolean }>`
  padding: 7px 14px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? "var(--color-primary)" : "var(--color-foreground-de-emp)"};
  border-bottom: 2px solid ${({ $active }) =>
    $active ? "var(--color-primary)" : "transparent"};
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.12s, border-color 0.12s;
  &:hover {
    color: ${({ $active }) =>
      $active ? "var(--color-primary)" : "var(--color-foreground)"};
  }
`;

const SPBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SPToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-de-emp);
  flex-shrink: 0;
`;

const SPSearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 5px 9px;
  background: var(--color-background-edit);
  flex: 1;
`;

const SPSearchInput = styled.input`
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--color-foreground);
  outline: none;
  width: 100%;
  &::placeholder { color: var(--color-foreground-de-emp); }
`;

const SPFilterBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background);
  font-size: 12px;
  color: var(--color-foreground);
  cursor: pointer;
  &:hover { background: var(--color-background-secondary); }
`;

const SPGrid = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SPGridHead = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-de-emp);
  background: var(--color-background-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
`;

const SPGridHeadCell = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: var(--color-foreground-de-emp);
  display: flex;
  align-items: center;
  gap: 3px;
`;

const SPGridRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr;
  padding: 9px 12px;
  border-bottom: 1px solid var(--color-border-de-emp);
  font-size: 12px;
  color: var(--color-foreground);
  &:hover { background: var(--color-background-hover); }
`;

const SPStateChip = styled.span<{ $state: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $state }) =>
    $state === "Successful"
      ? "var(--color-success-background)"
      : $state === "Faulted"
        ? "var(--color-error-background)"
        : $state === "Running"
          ? "var(--color-info-background)"
          : "var(--color-chip-default-background)"};
  color: ${({ $state }) =>
    $state === "Successful"
      ? "var(--color-success-text)"
      : $state === "Faulted"
        ? "var(--color-error-text)"
        : $state === "Running"
          ? "var(--color-info-text)"
          : "var(--color-foreground-de-emp)"};
`;

const SPEmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-foreground-de-emp);
  padding: 40px 20px;
`;

const SPEmptyIcon = styled.div`
  font-size: 36px;
  opacity: 0.35;
`;

const SPEmptyText = styled.span`
  font-size: 13px;
`;

const SPPagination = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border-de-emp);
  font-size: 12px;
  color: var(--color-foreground-de-emp);
  flex-shrink: 0;
`;

const SPPageBtn = styled.button`
  width: 22px;
  height: 22px;
  border: 1px solid var(--color-border-de-emp);
  border-radius: 3px;
  background: var(--color-background);
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-de-emp);
  &:disabled { opacity: 0.4; cursor: default; }
`;

const SPItemsSelect = styled.span`
  margin-left: auto;
  font-size: 12px;
  color: var(--color-foreground-de-emp);
`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

// ─── Mock jobs / history data ─────────────────────────────────────────────────

const MOCK_JOBS: Record<string, Array<{ state: string; started: string; ended: string; duration: string }>> = {
  // Parent triggers
  t1: [
    { state: "Successful", started: "2026-06-03 09:12", ended: "2026-06-03 09:14", duration: "1m 48s" },
    { state: "Faulted",    started: "2026-06-03 08:55", ended: "2026-06-03 08:56", duration: "0m 42s" },
    { state: "Successful", started: "2026-06-03 08:30", ended: "2026-06-03 08:33", duration: "2m 11s" },
  ],
  t2: [
    { state: "Running",    started: "2026-06-03 09:20", ended: "—",               duration: "—"      },
    { state: "Successful", started: "2026-06-03 09:01", ended: "2026-06-03 09:04", duration: "3m 02s" },
  ],
  // User triggers
  u1a: [
    { state: "Successful", started: "2026-06-04 09:05", ended: "2026-06-04 09:07", duration: "1m 52s" },
    { state: "Successful", started: "2026-06-04 07:30", ended: "2026-06-04 07:32", duration: "2m 04s" },
    { state: "Faulted",    started: "2026-06-03 18:12", ended: "2026-06-03 18:12", duration: "0m 18s" },
  ],
  u1b: [],
  u1c: [
    { state: "Successful", started: "2026-06-04 08:02", ended: "2026-06-04 08:04", duration: "1m 37s" },
  ],
  u3a: [
    { state: "Running",    started: "2026-06-04 09:18", ended: "—",               duration: "—"      },
    { state: "Successful", started: "2026-06-03 14:55", ended: "2026-06-03 14:58", duration: "3m 10s" },
  ],
};

const MOCK_HISTORY: Record<string, Array<{ event: string; timestamp: string; user: string }>> = {
  // Parent triggers
  t1: [
    { event: "Trigger enabled",    timestamp: "2026-06-01 14:20", user: "bogdan.doaga@uipath.com" },
    { event: "Connection updated", timestamp: "2026-05-30 10:05", user: "sorin.buse@uipath.com"   },
    { event: "Trigger created",    timestamp: "2026-05-19 17:14", user: "bogdan.doaga@uipath.com" },
  ],
  t2: [
    { event: "Trigger enabled",    timestamp: "2026-06-02 09:00", user: "bogdan.doaga@uipath.com" },
  ],
  // User triggers
  u1a: [
    { event: "User trigger enabled",    timestamp: "2026-06-01 15:00", user: "bogdan.doaga@uipath.com" },
    { event: "Connection set",          timestamp: "2026-06-01 14:55", user: "bogdan.doaga@uipath.com" },
    { event: "User trigger created",    timestamp: "2026-06-01 14:53", user: "bogdan.doaga@uipath.com" },
  ],
  u1b: [
    { event: "User trigger disabled",   timestamp: "2026-06-02 11:30", user: "sorin.buse@uipath.com" },
    { event: "User trigger created",    timestamp: "2026-06-01 16:00", user: "sorin.buse@uipath.com" },
  ],
  u1c: [
    { event: "User trigger enabled",    timestamp: "2026-06-03 09:00", user: "paul.motiu@uipath.com" },
    { event: "User trigger created",    timestamp: "2026-06-03 08:55", user: "paul.motiu@uipath.com" },
  ],
  u3a: [
    { event: "User trigger enabled",    timestamp: "2026-05-28 10:12", user: "bogdan.doaga@uipath.com" },
    { event: "User trigger created",    timestamp: "2026-05-28 10:08", user: "bogdan.doaga@uipath.com" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export function UserEventTriggersPrototype() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Side panel state
  const [panelTriggerId, setPanelTriggerId] = useState<string | null>(null);
  const [panelUserTriggerId, setPanelUserTriggerId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"Jobs" | "History" | "Traces">("Jobs");
  const panelTrigger = MOCK_TRIGGERS.find((t) => t.id === panelTriggerId) ?? null;
  const panelUserTrigger = panelTrigger?.userTriggers.find((ut) => ut.id === panelUserTriggerId) ?? null;
  // Data key: user trigger ID when viewing a user trigger, otherwise parent trigger ID
  const panelDataKey = panelUserTriggerId ?? panelTriggerId ?? "";

  function openPanel(id: string, tab: "Jobs" | "History" | "Traces" = "Jobs") {
    setPanelTriggerId(id);
    setPanelUserTriggerId(null);
    setPanelTab(tab);
  }

  function openUserPanel(triggerId: string, userTriggerId: string, tab: "Jobs" | "History" | "Traces" = "Jobs") {
    setPanelTriggerId(triggerId);
    setPanelUserTriggerId(userTriggerId);
    setPanelTab(tab);
  }

  function closePanel() {
    setPanelTriggerId(null);
    setPanelUserTriggerId(null);
  }

  // Close menu on outside click (including Escape key)
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const openMenuForRow = useCallback((id: string, btn: HTMLButtonElement) => {
    if (openMenu === id) {
      setOpenMenu(null);
      return;
    }
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenMenu(id);
  }, [openMenu]);

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredTriggers = MOCK_TRIGGERS.filter((t) =>
    t.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <Page>
      {/* ── Page chrome ─────────────────────────────────── */}
      <TopBar>
        <BreadcrumbRow>
          <BreadcrumbLink>Automations</BreadcrumbLink>
          <BreadcrumbSep>›</BreadcrumbSep>
          <BreadcrumbLink>Triggers</BreadcrumbLink>
          <BreadcrumbSep>›</BreadcrumbSep>
          <BreadcrumbCurrent>Event Triggers</BreadcrumbCurrent>
        </BreadcrumbRow>
        <PageNav>
          {["Time Triggers", "Queue Triggers", "Event Triggers", "API Triggers"].map(
            (tab) => (
              <NavTab key={tab} $active={tab === "Event Triggers"}>
                {tab}
              </NavTab>
            ),
          )}
        </PageNav>
      </TopBar>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <Toolbar>
        <SearchWrap>
          <span style={{ color: "var(--color-foreground-de-emp)", fontSize: 13 }}>
            🔍
          </span>
          <SearchInput
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </SearchWrap>
        <FilterChip>State: All ▾</FilterChip>
        <FilterChip>Connector: All ▾</FilterChip>
        <FilterChip>Connection: All ▾</FilterChip>
        <FilterChip>Job priority: All ▾</FilterChip>
        <Spacer />
        <AddBtn>+ Add a new trigger</AddBtn>
      </Toolbar>

      {/* ── Main content row (grid + side panel) ───────── */}
      <ContentRow>
      <MainArea>

      {/* ── Grid ────────────────────────────────────────── */}
      <GridWrap>
        <Grid>
          <GridHead>
            <GridHeadRow>
              <Th $width="16px" />
              <CheckboxCell as="th" $width="36px">
                <input type="checkbox" />
              </CheckboxCell>
              <Th $width="240px">
                Name <SortIcon>↕</SortIcon>
              </Th>
              <Th $width="160px">
                Process <SortIcon>↕</SortIcon>
              </Th>
              <Th $width="140px">
                Description <SortIcon>↕</SortIcon>
              </Th>
              <Th $width="120px">Connector</Th>
              <Th $width="180px">Connection</Th>
              <Th $width="110px">
                Job priority <SortIcon>↕</SortIcon>
              </Th>
              <Th $width="90px">Type</Th>
              <Th $width="48px" />
            </GridHeadRow>
          </GridHead>

          <GridBody>
            {filteredTriggers.map((trigger) => {
              const expanded = expandedRows.has(trigger.id);

              return (
                <>
                  <GridRow
                    key={trigger.id}
                    $expanded={expanded}
                    $configurable={trigger.configurableByUsers}
                    onClick={() => openPanel(trigger.id, "Jobs")}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Expand toggle (only for configurable rows) */}
                    <ExpandCell onClick={(e) => e.stopPropagation()}>
                      {trigger.configurableByUsers && (
                        <ExpandBtn
                          $expanded={expanded}
                          onClick={() => toggleRow(trigger.id)}
                          title={expanded ? "Collapse user triggers" : "Show user triggers"}
                        >
                          ▶
                        </ExpandBtn>
                      )}
                    </ExpandCell>

                    {/* Checkbox */}
                    <CheckboxCell onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                    </CheckboxCell>

                    {/* Name */}
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusDot $active={trigger.state === "active"} />
                        <TriggerName
                          title={trigger.name}
                          onClick={() => openPanel(trigger.id, "Jobs")}
                        >
                          {trigger.name.length > 30
                            ? trigger.name.slice(0, 30) + "…"
                            : trigger.name}
                        </TriggerName>
                      </div>
                    </Td>

                    {/* Process */}
                    <Td title={trigger.process}>{trigger.process}</Td>

                    {/* Description */}
                    <Td
                      style={{ color: "var(--color-foreground-de-emp)", fontSize: 12 }}
                      title={trigger.description}
                    >
                      {trigger.description || "—"}
                    </Td>

                    {/* Connector */}
                    <Td>
                      {trigger.connectorName ? (
                        <ConnectorCell>
                          <ConnectorIcon>{trigger.connectorIcon}</ConnectorIcon>
                          {trigger.connectorName}
                        </ConnectorCell>
                      ) : (
                        <span style={{ color: "var(--color-foreground-de-emp)" }}>
                          —
                        </span>
                      )}
                    </Td>

                    {/* Connection */}
                    <Td>
                      {trigger.configurableByUsers ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <ConfigurableTag>
                            👥 Configurable by users
                          </ConfigurableTag>
                          {trigger.userTriggers.length > 0 && (
                            <UserCountBadge
                              title={`${trigger.userTriggers.length} user trigger${trigger.userTriggers.length !== 1 ? "s" : ""} configured`}
                            >
                              {trigger.userTriggers.length}
                            </UserCountBadge>
                          )}
                        </div>
                      ) : (
                        <span title={trigger.connection}>
                          {trigger.connection.length > 20
                            ? trigger.connection.slice(0, 20) + "…"
                            : trigger.connection}
                        </span>
                      )}
                    </Td>

                    {/* Job priority */}
                    <Td>
                      <PriorityCell>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              trigger.jobPriority === "High"
                                ? "var(--color-warning-icon)"
                                : "var(--color-border)",
                            flexShrink: 0,
                          }}
                        />
                        {trigger.jobPriority}
                      </PriorityCell>
                    </Td>

                    {/* Type */}
                    <Td style={{ color: "var(--color-foreground-de-emp)", fontSize: 12 }}>
                      {trigger.type}
                    </Td>

                    {/* Actions menu button (dropdown rendered outside table via fixed positioning) */}
                    <ActionCell onClick={(e) => e.stopPropagation()}>
                      <MenuBtn
                        onClick={(e) => openMenuForRow(trigger.id, e.currentTarget)}
                        aria-label="Row actions"
                      >
                        ⋮
                      </MenuBtn>
                    </ActionCell>
                  </GridRow>

                  {/* ── Expanded: user sub-table ─────────── */}
                  {trigger.configurableByUsers && expanded && (
                    <SubTableRow key={`${trigger.id}-sub`}>
                      <SubTableCell colSpan={10}>
                        <SubTableWrap>
                          <SubTableHeader>
                            <SubTableTitle>
                              User triggers
                              {trigger.userTriggers.length > 0 &&
                                ` · ${trigger.userTriggers.length} configured`}
                            </SubTableTitle>
                            <AddUserTriggerBtn>
                              + Add user trigger
                            </AddUserTriggerBtn>
                          </SubTableHeader>

                          {trigger.userTriggers.length === 0 ? (
                            <EmptyState>
                              <EmptyStateIcon>🔌</EmptyStateIcon>
                              <EmptyStateText>No user triggers yet</EmptyStateText>
                              <EmptyStateSub>
                                Users can create their own trigger instance using their
                                personal Connection.
                              </EmptyStateSub>
                            </EmptyState>
                          ) : (
                            <SubTable>
                              <thead>
                                <tr>
                                  <SubTh $width="220px">User</SubTh>
                                  <SubTh $width="180px">Connection</SubTh>
                                  <SubTh $width="90px">State</SubTh>
                                  <SubTh $width="120px">Last run</SubTh>
                                  <SubTh $width="60px" />
                                </tr>
                              </thead>
                              <tbody>
                                {trigger.userTriggers.map((ut) => (
                                  <SubTr
                                    key={ut.id}
                                    onClick={() => openUserPanel(trigger.id, ut.id)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <SubTd>
                                      <UserCell>
                                        <Avatar>{ut.initials}</Avatar>
                                        <UserInfo>
                                          <UserName>{ut.user}</UserName>
                                          <UserEmail>{ut.email}</UserEmail>
                                        </UserInfo>
                                      </UserCell>
                                    </SubTd>
                                    <SubTd>
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 5,
                                        }}
                                      >
                                        🔵 {ut.connection}
                                      </span>
                                    </SubTd>
                                    <SubTd>
                                      <StateChip $state={ut.state}>
                                        {ut.state === "enabled" ? "✓ " : ""}
                                        {ut.state.charAt(0).toUpperCase() +
                                          ut.state.slice(1)}
                                      </StateChip>
                                    </SubTd>
                                    <SubTd
                                      style={{
                                        color: "var(--color-foreground-de-emp)",
                                        fontSize: 12,
                                      }}
                                    >
                                      {ut.lastRun}
                                    </SubTd>
                                    <SubTd
                                      style={{ textAlign: "right" }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MenuBtn
                                        style={{ fontSize: 14 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openMenuForRow(ut.id, e.currentTarget as HTMLButtonElement);
                                        }}
                                      >
                                        ⋮
                                      </MenuBtn>
                                    </SubTd>
                                  </SubTr>
                                ))}
                              </tbody>
                            </SubTable>
                          )}
                        </SubTableWrap>
                      </SubTableCell>
                    </SubTableRow>
                  )}
                </>
              );
            })}
          </GridBody>
        </Grid>
      </GridWrap>

      {/* ── Pagination ──────────────────────────────────── */}
      <PaginationRow>
        <PageBtn disabled>⟨⟨</PageBtn>
        <PageBtn disabled>⟨</PageBtn>
        <span>1 – {filteredTriggers.length} / {filteredTriggers.length}</span>
        <PageBtn disabled>⟩</PageBtn>
        <PageBtn disabled>⟩⟩</PageBtn>
      </PaginationRow>

      </MainArea>

      {/* ── Side panel ──────────────────────────────────── */}
      {panelTrigger && (
        <SidePanel>
          <SPHeader>
            <SPTitleRow>
              {panelUserTrigger ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Avatar style={{ flexShrink: 0 }}>{panelUserTrigger.initials}</Avatar>
                  <div style={{ minWidth: 0 }}>
                    <SPTitle style={{ fontSize: 13 }}>{panelUserTrigger.user}</SPTitle>
                    <div style={{ fontSize: 11, color: "var(--color-foreground-de-emp)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {panelTrigger.name}
                    </div>
                  </div>
                </div>
              ) : (
                <SPTitle>{panelTrigger.name}</SPTitle>
              )}
              <SPIconBtn title="Expand" onClick={() => {}}>⤢</SPIconBtn>
              <SPIconBtn title="Close" onClick={closePanel}>✕</SPIconBtn>
            </SPTitleRow>
            <SPMeta>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {panelUserTrigger ? (
                    <>
                      <SPMetaRow>
                        <SPMetaLabel>Connection:</SPMetaLabel>
                        {panelUserTrigger.connection}
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>State:</SPMetaLabel>
                        <StateChip $state={panelUserTrigger.state} style={{ fontSize: 10, padding: "1px 6px" }}>
                          {panelUserTrigger.state === "enabled" ? "✓ " : ""}
                          {panelUserTrigger.state.charAt(0).toUpperCase() + panelUserTrigger.state.slice(1)}
                        </StateChip>
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>Last run:</SPMetaLabel>
                        {panelUserTrigger.lastRun}
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>Process:</SPMetaLabel>
                        {panelTrigger.process}
                      </SPMetaRow>
                    </>
                  ) : (
                    <>
                      <SPMetaRow>
                        <SPMetaLabel>Process:</SPMetaLabel>
                        {panelTrigger.process}
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>Details:</SPMetaLabel>
                        Agentic process
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>Tags:</SPMetaLabel>
                        Epic, sap
                      </SPMetaRow>
                      <SPMetaRow>
                        <SPMetaLabel>Event Type:</SPMetaLabel>
                        N/A
                      </SPMetaRow>
                    </>
                  )}
                </div>
                <SPAuditLink href="#" onClick={(e) => e.preventDefault()}>
                  ↗ Go to Audit
                </SPAuditLink>
              </div>
            </SPMeta>
            <SPTabRow>
              {(["Jobs", "History", "Traces"] as const).map((tab) => (
                <SPTab
                  key={tab}
                  $active={panelTab === tab}
                  onClick={() => setPanelTab(tab)}
                >
                  {tab}
                </SPTab>
              ))}
            </SPTabRow>
          </SPHeader>

          <SPBody>
            <SPToolbar>
              <SPSearchWrap>
                <span style={{ fontSize: 12, color: "var(--color-foreground-de-emp)" }}>🔍</span>
                <SPSearchInput placeholder="Search" />
              </SPSearchWrap>
              <SPFilterBtn>⊟ ▾</SPFilterBtn>
              <SPFilterBtn>⊜ ▾</SPFilterBtn>
            </SPToolbar>

            {panelTab === "Jobs" && (() => {
              const jobs = MOCK_JOBS[panelDataKey] ?? [];
              if (jobs.length === 0) {
                return (
                  <SPEmptyState>
                    <SPEmptyIcon>◎</SPEmptyIcon>
                    <SPEmptyText>No data to display yet.</SPEmptyText>
                  </SPEmptyState>
                );
              }
              return (
                <SPGrid>
                  <SPGridHead>
                    <input type="checkbox" style={{ margin: "auto" }} />
                    <SPGridHeadCell>State ↕</SPGridHeadCell>
                    <SPGridHeadCell>Started ↕</SPGridHeadCell>
                    <SPGridHeadCell>Ended ↕</SPGridHeadCell>
                    <SPGridHeadCell>Duration</SPGridHeadCell>
                  </SPGridHead>
                  {jobs.map((job, i) => (
                    <SPGridRow key={i}>
                      <input type="checkbox" style={{ margin: "auto" }} />
                      <SPStateChip $state={job.state}>{job.state}</SPStateChip>
                      <span style={{ fontSize: 11, color: "var(--color-foreground-de-emp)" }}>{job.started}</span>
                      <span style={{ fontSize: 11, color: "var(--color-foreground-de-emp)" }}>{job.ended}</span>
                      <span style={{ fontSize: 11, color: "var(--color-foreground-de-emp)" }}>{job.duration}</span>
                    </SPGridRow>
                  ))}
                </SPGrid>
              );
            })()}

            {panelTab === "History" && (() => {
              const history = MOCK_HISTORY[panelDataKey] ?? [];
              if (history.length === 0) {
                return (
                  <SPEmptyState>
                    <SPEmptyIcon>◎</SPEmptyIcon>
                    <SPEmptyText>No history to display yet.</SPEmptyText>
                  </SPEmptyState>
                );
              }
              return (
                <SPGrid>
                  <SPGridHead>
                    <span />
                    <SPGridHeadCell style={{ gridColumn: "2 / 4" }}>Event</SPGridHeadCell>
                    <SPGridHeadCell>Timestamp</SPGridHeadCell>
                    <SPGridHeadCell>User</SPGridHeadCell>
                  </SPGridHead>
                  {history.map((h, i) => (
                    <SPGridRow key={i}>
                      <span />
                      <span style={{ gridColumn: "2 / 4", fontSize: 12 }}>{h.event}</span>
                      <span style={{ fontSize: 11, color: "var(--color-foreground-de-emp)" }}>{h.timestamp}</span>
                      <span style={{ fontSize: 11, color: "var(--color-foreground-de-emp)", overflow: "hidden", textOverflow: "ellipsis" }}>{h.user}</span>
                    </SPGridRow>
                  ))}
                </SPGrid>
              );
            })()}

            {panelTab === "Traces" && (
              <SPEmptyState>
                <SPEmptyIcon>◎</SPEmptyIcon>
                <SPEmptyText>No data to display yet.</SPEmptyText>
              </SPEmptyState>
            )}
          </SPBody>

          <SPPagination>
            <SPPageBtn disabled>⟨⟨</SPPageBtn>
            <SPPageBtn disabled>⟨</SPPageBtn>
            <span>
              1 – {(panelTab === "Jobs" ? MOCK_JOBS[panelDataKey] : MOCK_HISTORY[panelDataKey])?.length ?? 0} / {(panelTab === "Jobs" ? MOCK_JOBS[panelDataKey] : MOCK_HISTORY[panelDataKey])?.length ?? 0}
            </span>
            <SPPageBtn disabled>⟩</SPPageBtn>
            <SPPageBtn disabled>⟩⟩</SPPageBtn>
            <SPItemsSelect>Items 25 ▾</SPItemsSelect>
          </SPPagination>
        </SidePanel>
      )}

      </ContentRow>

      {/* ── Floating row-action menu (fixed, escapes table overflow) ── */}
      {openMenu && (
        <DropMenu
          ref={menuRef}
          $top={menuPos.top}
          $right={menuPos.right}
        >
          {(() => {
            const trigger = MOCK_TRIGGERS.find((t) => t.id === openMenu);
            return MENU_ITEMS.map((item, idx) =>
              item === null ? (
                <MenuDivider key={`div-${idx}`} />
              ) : (
                <MenuItem
                  key={item}
                  $danger={item === "Remove"}
                  $disabled={item === "Enable" && trigger?.state === "active"}
                  onClick={() => {
                    if (item === "View jobs" || item === "View history" || item === "View traces") {
                      const tab = item === "View jobs" ? "Jobs" : item === "View history" ? "History" : "Traces";
                      openPanel(openMenu, tab as "Jobs" | "History" | "Traces");
                    }
                    setOpenMenu(null);
                  }}
                >
                  {item}
                </MenuItem>
              ),
            );
          })()}
        </DropMenu>
      )}
    </Page>
  );
}
