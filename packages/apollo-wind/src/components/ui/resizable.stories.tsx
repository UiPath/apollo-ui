import type { Meta } from '@storybook/react-vite';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';
import { Row } from './layout';

const meta = {
  title: 'Design System/Layout/Resizable',
  component: ResizablePanelGroup,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;

export const Horizontal = {
  args: {},
  render: () => (
    <div className="h-screen p-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-[400px] rounded-lg border">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Left Panel</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Right Panel</span>
          </Row>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Vertical = {
  args: {},
  render: () => (
    <div className="h-screen p-4">
      <ResizablePanelGroup orientation="vertical" className="min-h-[400px] rounded-lg border">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Top Panel</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Bottom Panel</span>
          </Row>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ThreePanels = {
  args: {},
  render: () => (
    <div className="h-screen p-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-[400px] rounded-lg border">
        <ResizablePanel defaultSize="25%" minSize="15%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Sidebar</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="50%" minSize="30%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Main Content</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="25%" minSize="15%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Right Sidebar</span>
          </Row>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Nested = {
  args: {},
  render: () => (
    <div className="h-screen p-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-[400px] rounded-lg border">
        <ResizablePanel defaultSize="25%" minSize="15%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Left Sidebar</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="75%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="50%" minSize="30%">
              <Row h="full" align="center" justify="center" className="p-6">
                <span className="font-semibold">Top Content</span>
              </Row>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize="50%" minSize="30%">
              <Row h="full" align="center" justify="center" className="p-6">
                <span className="font-semibold">Bottom Content</span>
              </Row>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const WithHandleVariant = {
  args: {},
  render: () => (
    <div className="h-screen p-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-[400px] rounded-lg border">
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Left Panel</span>
          </Row>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%" minSize="20%">
          <Row h="full" align="center" justify="center" className="p-6">
            <span className="font-semibold">Right Panel</span>
          </Row>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
