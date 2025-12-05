import * as React from "react";
import { cn } from "@/lib";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  X,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Row, Column } from "@/components/ui/layout";

// Shell container
interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Shell({ className, children, ...props }: ShellProps) {
  return (
    <Column
      overflow="hidden"
      className={cn("h-[600px] w-full rounded-lg border bg-background", className)}
      {...props}
    >
      {children}
    </Column>
  );
}

// Title bar
interface ShellTitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function ShellTitleBar({ className, title, children, ...props }: ShellTitleBarProps) {
  return (
    <Row
      h={9}
      justify="between"
      align="center"
      className={cn("border-b bg-muted/50 px-3", className)}
      {...props}
    >
      <Row gap={2} align="center">
        <Row gap={1.5}>
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </Row>
        {title && <span className="ml-3 text-xs text-muted-foreground">{title}</span>}
      </Row>
      {children}
    </Row>
  );
}

// Main content area with sidebar
interface ShellContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ShellContent({ className, children, ...props }: ShellContentProps) {
  return (
    <Row flex={1} overflow="hidden" className={className} {...props}>
      {children}
    </Row>
  );
}

// Sidebar
interface ShellSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: number;
}

export function ShellSidebar({
  className,
  children,
  collapsed = false,
  onCollapsedChange,
  width = 240,
  ...props
}: ShellSidebarProps) {
  return (
    <Column
      className={cn(
        "border-r bg-muted/30 transition-all duration-200",
        collapsed ? "w-0 overflow-hidden" : "",
        className,
      )}
      style={{ width: collapsed ? 0 : width }}
      {...props}
    >
      {children}
    </Column>
  );
}

// Sidebar header
interface ShellSidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function ShellSidebarHeader({
  className,
  title,
  collapsed,
  onCollapsedChange,
  ...props
}: ShellSidebarHeaderProps) {
  return (
    <Row
      h={8}
      justify="between"
      align="center"
      className={cn("px-3 text-xs font-medium uppercase text-muted-foreground", className)}
      {...props}
    >
      <span>{title}</span>
      {onCollapsedChange && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      )}
    </Row>
  );
}

// File tree
interface FileTreeItem {
  name: string;
  type: "file" | "folder";
  children?: FileTreeItem[];
  icon?: React.ReactNode;
}

interface ShellFileTreeProps {
  items: FileTreeItem[];
  selectedFile?: string;
  onSelectFile?: (name: string) => void;
}

export function ShellFileTree({ items, selectedFile, onSelectFile }: ShellFileTreeProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {items.map((item) => (
          <FileTreeNode
            key={item.name}
            item={item}
            depth={0}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function FileTreeNode({
  item,
  depth,
  selectedFile,
  onSelectFile,
}: {
  item: FileTreeItem;
  depth: number;
  selectedFile?: string;
  onSelectFile?: (name: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const isFolder = item.type === "folder";
  const isSelected = selectedFile === item.name;

  return (
    <div>
      <Row
        gap={1}
        align="center"
        className={cn(
          "cursor-pointer rounded px-2 py-0.5 text-sm hover:bg-muted",
          isSelected && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onSelectFile?.(item.name);
          }
        }}
      >
        {isFolder ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-yellow-600" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-yellow-600" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {item.icon || <File className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </>
        )}
        <span className="truncate">{item.name}</span>
      </Row>
      {isFolder && expanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeNode
              key={child.name}
              item={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main panel area
interface ShellMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ShellMain({ className, children, ...props }: ShellMainProps) {
  return (
    <Column flex={1} overflow="hidden" className={className} {...props}>
      {children}
    </Column>
  );
}

// Tab bar
interface ShellTab {
  id: string;
  title: string;
  icon?: React.ReactNode;
}

interface ShellTabBarProps {
  tabs: ShellTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onTabClose?: (id: string) => void;
}

export function ShellTabBar({ tabs, activeTab, onTabChange, onTabClose }: ShellTabBarProps) {
  return (
    <Row h={9} align="center" className="border-b bg-muted/30">
      {tabs.map((tab) => (
        <Row
          key={tab.id}
          gap={2}
          align="center"
          className={cn(
            "group h-full cursor-pointer border-r px-3 text-sm",
            activeTab === tab.id
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:bg-muted/50",
          )}
          onClick={() => onTabChange?.(tab.id)}
        >
          {tab.icon}
          <span className="max-w-[120px] truncate">{tab.title}</span>
          {onTabClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Row>
      ))}
    </Row>
  );
}

// Editor/content pane
interface ShellPaneProps {
  children: React.ReactNode;
  className?: string;
}

export function ShellPane({ className, children }: ShellPaneProps) {
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="p-4">{children}</div>
    </ScrollArea>
  );
}

// Status bar
interface ShellStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function ShellStatusBar({ className, children, ...props }: ShellStatusBarProps) {
  return (
    <Row
      h={6}
      justify="between"
      align="center"
      className={cn("border-t bg-primary px-2 text-xs text-primary-foreground", className)}
      {...props}
    >
      {children}
    </Row>
  );
}

// Activity bar (left icon strip)
interface ShellActivityBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ShellActivityBar({ className, children, ...props }: ShellActivityBarProps) {
  return (
    <Column
      w={12}
      gap={2}
      align="center"
      className={cn("border-r bg-muted/50 py-2", className)}
      {...props}
    >
      {children}
    </Column>
  );
}

interface ShellActivityBarItemProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export function ShellActivityBarItem({
  icon,
  active,
  onClick,
  tooltip,
}: ShellActivityBarItemProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 rounded-none border-l-2 border-transparent",
        active && "border-primary bg-muted",
      )}
      onClick={onClick}
      title={tooltip}
    >
      {icon}
    </Button>
  );
}

// Panel (bottom panel like terminal)
interface ShellPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  height?: number;
  children: React.ReactNode;
}

export function ShellPanel({
  className,
  title,
  height = 200,
  children,
  ...props
}: ShellPanelProps) {
  return (
    <div className={cn("border-t", className)} style={{ height }} {...props}>
      {title && (
        <Row
          h={8}
          align="center"
          className="border-b bg-muted/30 px-3 text-xs font-medium uppercase text-muted-foreground"
        >
          {title}
        </Row>
      )}
      <ScrollArea className="h-full">
        <div className="p-2 font-mono text-sm">{children}</div>
      </ScrollArea>
    </div>
  );
}
