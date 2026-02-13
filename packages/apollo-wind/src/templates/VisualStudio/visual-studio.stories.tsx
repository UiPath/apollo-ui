import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Blocks, Bug, FileCode, FileJson, Files, GitBranch, Search, Settings } from 'lucide-react';
import { Column, Row } from '@/components/ui/layout';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';
import {
  Shell,
  ShellActivityBar,
  ShellActivityBarItem,
  ShellContent,
  ShellFileTree,
  ShellMain,
  ShellPane,
  ShellPanel,
  ShellSidebar,
  ShellSidebarHeader,
  ShellStatusBar,
  ShellTabBar,
  ShellTitleBar,
} from './shell';
import type { FileTreeItem } from './shell';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Future/Visual Studio',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(value: string) {
  if (value === 'legacy-dark') return 'legacy-dark';
  if (value === 'legacy-light') return 'legacy-light';
  if (value === 'wireframe') return 'future-wireframe';
  if (value === 'vertex') return 'future-vertex';
  if (value === 'canvas') return 'future-canvas';
  if (value === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Sample data
// ============================================================================

const sampleFiles: FileTreeItem[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'Button.tsx', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
          { name: 'Input.tsx', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
          { name: 'Shell.tsx', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
        ],
      },
      {
        name: 'hooks',
        type: 'folder',
        children: [
          { name: 'useAuth.ts', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
          { name: 'useTheme.ts', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
        ],
      },
      { name: 'App.tsx', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
      { name: 'index.tsx', type: 'file', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
    ],
  },
  { name: 'package.json', type: 'file', icon: <FileJson className="h-4 w-4 text-yellow-500" /> },
  { name: 'tsconfig.json', type: 'file', icon: <FileJson className="h-4 w-4 text-yellow-500" /> },
  { name: 'README.md', type: 'file' },
];

// ============================================================================
// Full IDE demo
// ============================================================================

function VSCodeShellDemo({ theme }: { theme: string }) {
  const themeClass = resolveThemeClass(theme);
  const [activeView, setActiveView] = React.useState('files');
  const [selectedFile, setSelectedFile] = React.useState('Shell.tsx');
  const [tabs, setTabs] = React.useState([
    { id: 'shell', title: 'Shell.tsx', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
    { id: 'button', title: 'Button.tsx', icon: <FileCode className="h-4 w-4 text-blue-500" /> },
  ]);
  const [activeTab, setActiveTab] = React.useState('shell');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const handleCloseTab = (id: string) => {
    setTabs(tabs.filter((t) => t.id !== id));
    if (activeTab === id && tabs.length > 1) {
      setActiveTab(tabs[0].id === id ? tabs[1].id : tabs[0].id);
    }
  };

  return (
    <div
      className={cn(themeClass, 'flex h-screen w-full bg-future-surface')}
      style={{ fontFamily: fontFamily.base }}
    >
      <Shell className="h-full w-full rounded-none border-0">
        <ShellTitleBar title="project — Visual Studio Code" />
        <ShellContent>
          <ShellActivityBar>
            <ShellActivityBarItem
              icon={<Files className="h-5 w-5" />}
              active={activeView === 'files'}
              onClick={() => { setActiveView('files'); setSidebarCollapsed(false); }}
              tooltip="Explorer"
            />
            <ShellActivityBarItem
              icon={<Search className="h-5 w-5" />}
              active={activeView === 'search'}
              onClick={() => { setActiveView('search'); setSidebarCollapsed(false); }}
              tooltip="Search"
            />
            <ShellActivityBarItem
              icon={<GitBranch className="h-5 w-5" />}
              active={activeView === 'git'}
              onClick={() => { setActiveView('git'); setSidebarCollapsed(false); }}
              tooltip="Source Control"
            />
            <ShellActivityBarItem
              icon={<Bug className="h-5 w-5" />}
              active={activeView === 'debug'}
              onClick={() => { setActiveView('debug'); setSidebarCollapsed(false); }}
              tooltip="Run and Debug"
            />
            <ShellActivityBarItem
              icon={<Blocks className="h-5 w-5" />}
              active={activeView === 'extensions'}
              onClick={() => { setActiveView('extensions'); setSidebarCollapsed(false); }}
              tooltip="Extensions"
            />
            <Column flex={1} />
            <ShellActivityBarItem
              icon={<Settings className="h-5 w-5" />}
              onClick={() => undefined}
              tooltip="Settings"
            />
          </ShellActivityBar>

          <ShellSidebar collapsed={sidebarCollapsed} width={260}>
            <ShellSidebarHeader
              title="Explorer"
              collapsed={sidebarCollapsed}
              onCollapsedChange={setSidebarCollapsed}
            />
            <ShellFileTree
              items={sampleFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </ShellSidebar>

          <ShellMain>
            <ShellTabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onTabClose={handleCloseTab}
            />
            <ShellPane>
              <pre className="text-sm">
                <code>{`import * as React from "react";
import { cn } from "@/lib";

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn(
      "flex h-full flex-col",
      className
    )}>
      {children}
    </div>
  );
}`}</code>
              </pre>
            </ShellPane>
            <ShellPanel title="Terminal" height={150}>
              <div className="text-muted-foreground">
                <div>$ npm run dev</div>
                <div className="text-green-500">ready - started server on 0.0.0.0:3000</div>
                <div>$ _</div>
              </div>
            </ShellPanel>
          </ShellMain>
        </ShellContent>
        <ShellStatusBar>
          <Row gap={3} align="center">
            <span>main</span>
            <span>TypeScript</span>
          </Row>
          <Row gap={3} align="center">
            <span>Ln 1, Col 1</span>
            <span>UTF-8</span>
          </Row>
        </ShellStatusBar>
      </Shell>
    </div>
  );
}

// ============================================================================
// Minimal shell demo
// ============================================================================

function MinimalShellDemo({ theme }: { theme: string }) {
  const themeClass = resolveThemeClass(theme);

  return (
    <div
      className={cn(themeClass, 'flex h-screen w-full bg-future-surface')}
      style={{ fontFamily: fontFamily.base }}
    >
      <Shell className="h-full w-full rounded-none border-0">
        <ShellTitleBar title="My App" />
        <ShellContent>
          <ShellMain>
            <ShellPane>
              <div className="text-center text-muted-foreground">
                <h2 className="text-lg font-semibold">Welcome</h2>
                <p>This is a minimal shell layout.</p>
              </div>
            </ShellPane>
          </ShellMain>
        </ShellContent>
        <ShellStatusBar>
          <span>Ready</span>
        </ShellStatusBar>
      </Shell>
    </div>
  );
}

// ============================================================================
// Sidebar-only demo
// ============================================================================

function SidebarOnlyDemo({ theme }: { theme: string }) {
  const themeClass = resolveThemeClass(theme);

  return (
    <div
      className={cn(themeClass, 'flex h-screen w-full bg-future-surface')}
      style={{ fontFamily: fontFamily.base }}
    >
      <Shell className="h-full w-full rounded-none border-0">
        <ShellTitleBar title="File Browser" />
        <ShellContent>
          <ShellSidebar width={280}>
            <ShellSidebarHeader title="Files" />
            <ShellFileTree items={sampleFiles} />
          </ShellSidebar>
          <ShellMain>
            <ShellPane>
              <p className="text-muted-foreground">Select a file to view its contents.</p>
            </ShellPane>
          </ShellMain>
        </ShellContent>
      </Shell>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  name: 'Default',
  render: (_, { globals }) => <VSCodeShellDemo theme={globals.futureTheme || 'dark'} />,
};

export const Minimal: Story = {
  name: 'Minimal',
  render: (_, { globals }) => <MinimalShellDemo theme={globals.futureTheme || 'dark'} />,
};

export const SidebarOnly: Story = {
  name: 'Sidebar Only',
  render: (_, { globals }) => <SidebarOnlyDemo theme={globals.futureTheme || 'dark'} />,
};
