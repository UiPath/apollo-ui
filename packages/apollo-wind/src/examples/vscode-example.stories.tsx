import * as React from 'react';

import { Blocks, Bug, FileCode, FileJson, Files, GitBranch, Search, Settings } from 'lucide-react';

import { Column, Row } from '@/components/ui/layout';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
} from './vscode-example';

const meta = {
  title: 'Examples/VSCode',
  component: Shell,
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFiles = [
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        name: 'components',
        type: 'folder' as const,
        children: [
          {
            name: 'Button.tsx',
            type: 'file' as const,
            icon: <FileCode className="h-4 w-4 text-blue-500" />,
          },
          {
            name: 'Input.tsx',
            type: 'file' as const,
            icon: <FileCode className="h-4 w-4 text-blue-500" />,
          },
          {
            name: 'Shell.tsx',
            type: 'file' as const,
            icon: <FileCode className="h-4 w-4 text-blue-500" />,
          },
        ],
      },
      {
        name: 'hooks',
        type: 'folder' as const,
        children: [
          {
            name: 'useAuth.ts',
            type: 'file' as const,
            icon: <FileCode className="h-4 w-4 text-blue-500" />,
          },
          {
            name: 'useTheme.ts',
            type: 'file' as const,
            icon: <FileCode className="h-4 w-4 text-blue-500" />,
          },
        ],
      },
      {
        name: 'App.tsx',
        type: 'file' as const,
        icon: <FileCode className="h-4 w-4 text-blue-500" />,
      },
      {
        name: 'index.tsx',
        type: 'file' as const,
        icon: <FileCode className="h-4 w-4 text-blue-500" />,
      },
    ],
  },
  {
    name: 'package.json',
    type: 'file' as const,
    icon: <FileJson className="h-4 w-4 text-yellow-500" />,
  },
  {
    name: 'tsconfig.json',
    type: 'file' as const,
    icon: <FileJson className="h-4 w-4 text-yellow-500" />,
  },
  { name: 'README.md', type: 'file' as const },
];

function VSCodeShellDemo() {
  const [activeView, setActiveView] = React.useState('files');
  const [selectedFile, setSelectedFile] = React.useState('Shell.tsx');
  const [tabs, setTabs] = React.useState([
    {
      id: 'shell',
      title: 'Shell.tsx',
      icon: <FileCode className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 'button',
      title: 'Button.tsx',
      icon: <FileCode className="h-4 w-4 text-blue-500" />,
    },
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
    <Shell className="h-[700px]">
      <ShellTitleBar title="project — Visual Studio Code" />
      <ShellContent>
        <ShellActivityBar>
          <ShellActivityBarItem
            icon={<Files className="h-5 w-5" />}
            active={activeView === 'files'}
            onClick={() => {
              setActiveView('files');
              setSidebarCollapsed(false);
            }}
            tooltip="Explorer"
          />
          <ShellActivityBarItem
            icon={<Search className="h-5 w-5" />}
            active={activeView === 'search'}
            onClick={() => {
              setActiveView('search');
              setSidebarCollapsed(false);
            }}
            tooltip="Search"
          />
          <ShellActivityBarItem
            icon={<GitBranch className="h-5 w-5" />}
            active={activeView === 'git'}
            onClick={() => {
              setActiveView('git');
              setSidebarCollapsed(false);
            }}
            tooltip="Source Control"
          />
          <ShellActivityBarItem
            icon={<Bug className="h-5 w-5" />}
            active={activeView === 'debug'}
            onClick={() => {
              setActiveView('debug');
              setSidebarCollapsed(false);
            }}
            tooltip="Run and Debug"
          />
          <ShellActivityBarItem
            icon={<Blocks className="h-5 w-5" />}
            active={activeView === 'extensions'}
            onClick={() => {
              setActiveView('extensions');
              setSidebarCollapsed(false);
            }}
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
  );
}

export const Default = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => <VSCodeShellDemo />,
} satisfies Story;

export const MinimalShell = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => (
    <Shell className="h-[400px]">
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
  ),
} satisfies Story;

export const WithSidebarOnly = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => (
    <Shell className="h-[500px]">
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
  ),
} satisfies Story;
