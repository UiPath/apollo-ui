import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FlowEditorLayout,
  SidebarPanelConfig,
  CanvasToolbar,
  PublishToolbar,
} from './flow-editor-layout-example';
import { Folders, Package, Sparkles } from 'lucide-react';
import * as React from 'react';
import { Column, Row } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';

const defaultSidebarOptions: SidebarPanelConfig[] = [
  { id: 'folders', icon: <Folders className="h-4 w-4" />, label: 'Folders' },
  {
    id: 'resources',
    icon: <Package className="h-4 w-4" />,
    label: 'Resources',
  },
  {
    id: 'autopilot',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Autopilot',
  },
];

const meta = {
  title: 'Examples/Flow/Editor Layout',
  component: FlowEditorLayout,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    activeSidebarId: {
      control: 'radio',
      options: ['folders', 'resources', 'autopilot'],
    },
    onSidebarChange: { action: 'sidebar changed' },
    onSidebarOpenChange: { action: 'sidebar open changed' },
  },
} satisfies Meta<typeof FlowEditorLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('autopilot');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
      <FlowEditorLayout
        sidebarOptions={defaultSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4" justify="center" align="center">
            <span className="text-sm text-muted-foreground">{activeSidebarId} content</span>
          </Column>
        }
        mainContent={
          <Column className="h-full" justify="center" align="center">
            <span className="text-muted-foreground">Main content</span>
          </Column>
        }
      />
    );
  },
} satisfies Story;

export const WithToolbars = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('autopilot');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
      <FlowEditorLayout
        sidebarOptions={defaultSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4">
            <h2 className="font-semibold capitalize">{activeSidebarId}</h2>
          </Column>
        }
        mainContent={
          <div className="relative h-full">
            <Column className="h-full" justify="center" align="center" gap={4}>
              <h1 className="text-2xl font-bold">Build mode</h1>
              <p className="text-muted-foreground">Drag and drop nodes to build your flow</p>
            </Column>

            <CanvasToolbar />

            <PublishToolbar />
          </div>
        }
      />
    );
  },
} satisfies Story;

export const WithBottomPanel = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('folders');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    return (
      <FlowEditorLayout
        sidebarOptions={defaultSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4">
            <h2 className="font-semibold capitalize">{activeSidebarId}</h2>
          </Column>
        }
        mainContent={
          <div className="relative h-full">
            <Column className="h-full" justify="center" align="center">
              <span className="text-muted-foreground">Flow Canvas</span>
            </Column>

            <CanvasToolbar />
            <PublishToolbar />
          </div>
        }
        bottomOpen={true}
        bottomContent={
          <Column className="p-4" gap={2}>
            <Row className="text-sm font-mono">
              <span className="text-muted-foreground">[00:00:01]</span>
              <span className="ml-2">Starting execution...</span>
            </Row>
            <Row className="text-sm font-mono">
              <span className="text-muted-foreground">[00:00:02]</span>
              <span className="ml-2 text-green-600">Node 1 completed</span>
            </Row>
          </Column>
        }
      />
    );
  },
} satisfies Story;

export const WithCustomSidebar = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('autopilot');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
      <FlowEditorLayout
        sidebarOptions={defaultSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4" gap={4}>
            <h2 className="font-semibold text-lg">Sidebar</h2>
            <p className="text-sm text-muted-foreground">Custom sidebar content</p>
            <Column gap={2}>
              <Button variant="outline" className="justify-start">
                Item 1
              </Button>
              <Button variant="outline" className="justify-start">
                Item 2
              </Button>
              <Button variant="outline" className="justify-start">
                Item 3
              </Button>
            </Column>
          </Column>
        }
        mainContent={
          <div className="relative h-full">
            <Column className="h-full" justify="center" align="center">
              <span className="text-muted-foreground">Canvas</span>
            </Column>

            <CanvasToolbar />
          </div>
        }
      />
    );
  },
} satisfies Story;

const customSidebarOptions: SidebarPanelConfig[] = [
  { id: 'files', icon: <Folders className="h-4 w-4" />, label: 'Files' },
  { id: 'packages', icon: <Package className="h-4 w-4" />, label: 'Packages' },
  { id: 'ai', icon: <Sparkles className="h-4 w-4" />, label: 'AI Assistant' },
];

export const CustomPanels = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('ai');
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
      <FlowEditorLayout
        sidebarOptions={customSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4" gap={4}>
            <h2 className="font-semibold">
              {customSidebarOptions.find((p) => p.id === activeSidebarId)?.label}
            </h2>
            <p className="text-sm text-muted-foreground">Panel content for {activeSidebarId}</p>
          </Column>
        }
        mainContent={
          <Column className="h-full" justify="center" align="center">
            <span className="text-muted-foreground">Main content area</span>
          </Column>
        }
      />
    );
  },
} satisfies Story;

export const PanelClosed = {
  render: () => {
    const [activeSidebarId, setActiveSidebarId] = React.useState('autopilot');
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
      <FlowEditorLayout
        sidebarOptions={defaultSidebarOptions}
        activeSidebarId={activeSidebarId}
        sidebarOpen={sidebarOpen}
        onSidebarChange={setActiveSidebarId}
        onSidebarOpenChange={setSidebarOpen}
        sidebarContent={
          <Column className="h-full p-4">
            <h2 className="font-semibold capitalize">{activeSidebarId}</h2>
          </Column>
        }
        mainContent={
          <Column className="h-full" justify="center" align="center">
            <span className="text-muted-foreground">Main content</span>
          </Column>
        }
      />
    );
  },
} satisfies Story;
