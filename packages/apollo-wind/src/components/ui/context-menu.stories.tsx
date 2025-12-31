import type { Meta } from '@storybook/react-vite';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu';
import { Row } from './layout';

const meta: Meta<typeof ContextMenu> = {
  title: 'Design System/Overlays/Context Menu',
  component: ContextMenu,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Row
          align="center"
          justify="center"
          className="h-[150px] w-[300px] rounded-md border border-dashed text-sm"
        >
          Right click here
        </Row>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuItem>Reload</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
