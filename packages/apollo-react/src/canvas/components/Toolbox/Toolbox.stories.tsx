import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BpmnBoundaryEventDefault,
  BpmnEndEventDefault,
  BpmnGatewayExclusive,
  FigureRectangle54,
} from '../../../icons';
import { ConnectorHandleIcon } from '../../icons';
import { withCanvasProviders } from '../../storybook-utils';
import type { ListItem } from './ListView';
import type { ToolboxQuickAction } from './QuickActionsRow';
import { Toolbox } from './Toolbox';

const meta: Meta<typeof Toolbox> = {
  title: 'Components/Toolbox',
  component: Toolbox,
  parameters: {
    layout: 'centered',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof Toolbox>;

const SAMPLE_ITEMS: ListItem[] = [
  { id: 'task', name: 'Task', icon: { name: 'square' }, data: {} },
  { id: 'call-activity', name: 'Call Activity', icon: { name: 'box' }, data: {} },
  { id: 'gateway', name: 'Gateway', icon: { name: 'diamond' }, data: {} },
  { id: 'event', name: 'Event', icon: { name: 'circle' }, data: {} },
  { id: 'subprocess', name: 'Subprocess', icon: { name: 'layers' }, data: {} },
];

export const Default: Story = {
  args: {
    title: 'Add element',
    initialItems: SAMPLE_ITEMS,
    onClose: () => {},
    onItemSelect: () => {},
  },
};

/**
 * Pairs a row of icon shortcuts with the picker so high-frequency shapes are
 * one click away. Trailing actions appear after a separator — used in the
 * BPMN canvas-element-picker to surface the "Connect" tool alongside the
 * shape buttons. Other canvas teams adding fast-access tools above a Toolbox
 * picker can pass them via `quickActions` instead of stacking another row
 * outside the popover.
 */
export const WithQuickActions: Story = {
  args: {
    title: 'Add element',
    initialItems: SAMPLE_ITEMS,
    onClose: () => {},
    onItemSelect: () => {},
    quickActions: [
      {
        id: 'task',
        title: 'Task',
        icon: <FigureRectangle54 size={20} />,
        onClick: () => {},
      },
      {
        id: 'gateway',
        title: 'Exclusive gateway',
        icon: <BpmnGatewayExclusive size={20} />,
        onClick: () => {},
      },
      {
        id: 'intermediate-event',
        title: 'Intermediate event',
        icon: <BpmnBoundaryEventDefault size={20} />,
        onClick: () => {},
      },
      {
        id: 'end-event',
        title: 'End event',
        icon: <BpmnEndEventDefault size={20} />,
        onClick: () => {},
      },
      {
        id: 'connect',
        title: 'Connect',
        icon: <ConnectorHandleIcon w={20} h={20} />,
        onClick: () => {},
        trailing: true,
      },
    ] satisfies ToolboxQuickAction[],
  },
};

/** Items without `icon.url`/`icon.name`/`icon.Component` render an initials badge derived from `name`. */
export const WithInitialsFallback: Story = {
  args: {
    title: 'Add element',
    initialItems: [
      { id: 'foundry', name: 'Microsoft Azure AI Foundry', data: {} },
      { id: 'vertex', name: 'Google Vertex', data: {} },
      { id: 'agentforce', name: 'Salesforce Agentforce', data: {} },
      { id: 'snowflake', name: 'Snowflake Cortex', data: {} },
      { id: 'mixed', name: 'Has Icon', icon: { name: 'star' }, data: {} },
    ] satisfies ListItem[],
    onClose: () => {},
    onItemSelect: () => {},
  },
};
