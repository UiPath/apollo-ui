import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryInfoPanel, withCanvasProviders } from '../../storybook-utils';
import { CanvasIcon } from '../../utils/icon-registry';
import { ListView } from './ListView';

const meta: Meta<typeof ListView> = {
  title: 'Components/Toolbox/ListView',
  component: ListView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Stories for the empty-state path of `ListView`. When `items` is empty',
          'and no skeleton spec is active, the component renders an icon +',
          'message instead of the virtualized list. Both the icon and the',
          'message can be overridden via `emptyStateIcon` and',
          '`emptyStateMessage`.',
        ].join(' '),
      },
    },
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
};

export default meta;
type Story = StoryObj<typeof ListView>;

function PanelWrapper({
  children,
  paddingTop = '200px',
}: {
  children: React.ReactNode;
  paddingTop?: string;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--color-background-secondary)',
        paddingTop,
      }}
    >
      <div
        style={{
          width: '320px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--canvas-background-raised)',
          border: '1px solid var(--canvas-border-de-emp)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const noop = () => {};

export const EmptyStateDefault: Story = {
  name: 'Empty state — defaults',
  parameters: {
    docs: {
      description: {
        story:
          'No overrides. Shows the built-in `"No items found"` message and the default `search-x` lucide icon.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
  },
  render: (args) => (
    <PanelWrapper>
      <ListView {...args} />
    </PanelWrapper>
  ),
};

export const EmptyStateCustomMessage: Story = {
  name: 'Empty state — custom message',
  parameters: {
    docs: {
      description: {
        story:
          'Overrides only `emptyStateMessage`. Useful when the surface has a more specific empty-state copy than the generic default.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
    emptyStateMessage: 'No tools match your search. Try a different keyword.',
  },
  render: (args) => (
    <PanelWrapper>
      <ListView {...args} />
    </PanelWrapper>
  ),
};

export const EmptyStateCustomIcon: Story = {
  name: 'Empty state — custom icon',
  parameters: {
    docs: {
      description: {
        story:
          'Overrides only `emptyStateIcon`. Any lucide icon name (kebab-case) or registered custom icon id is accepted.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
    emptyStateIcon: 'inbox',
  },
  render: (args) => (
    <PanelWrapper>
      <ListView {...args} />
    </PanelWrapper>
  ),
};

export const EmptyStateFullyCustom: Story = {
  name: 'Empty state — custom icon and message',
  parameters: {
    docs: {
      description: {
        story:
          'Overrides both props together — the realistic "first-run" / onboarding scenario where the panel has nothing to show yet and wants to guide the user.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
    emptyStateIcon: 'package-open',
    emptyStateMessage: 'Nothing here yet — add your first item to get started.',
  },
  render: (args) => (
    <PanelWrapper>
      <ListView {...args} />
    </PanelWrapper>
  ),
};

export const EmptyStateRenderProp: Story = {
  name: 'Empty state — renderEmptyState (custom node)',
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates `renderEmptyState`. When supplied, the prop fully replaces the built-in Column + icon + message and lets the caller control layout, illustration, copy, and actions. Useful for richer onboarding states or app-specific CTAs.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
    renderEmptyState: () => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          minHeight: 250,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--canvas-background-raised)',
            border: '1px dashed var(--canvas-border-de-emp)',
          }}
        >
          <CanvasIcon icon="sparkles" size={28} color="var(--canvas-foreground-de-emp)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>No nodes available yet</div>
          <div style={{ fontSize: 12, color: 'var(--canvas-foreground-de-emp)', marginTop: 4 }}>
            Connect your data source to start building.
          </div>
        </div>
        <button
          type="button"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: 'var(--canvas-accent)',
            color: 'var(--canvas-accent-foreground)',
            border: 'none',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Connect data source
        </button>
      </div>
    ),
  },
  render: (args) => (
    <>
      <StoryInfoPanel
        title="renderEmptyState"
        description={
          'The panel is given an empty `items` array. Instead of the built-in icon + ' +
          '"No items found" message, ListView renders the caller-supplied node. The ' +
          'caller controls layout, illustration, copy, and any CTAs — useful for ' +
          'onboarding flows.'
        }
      />
      <PanelWrapper>
        <ListView {...args} />
      </PanelWrapper>
    </>
  ),
};

export const EmptyStateRenderPropOverridesMessage: Story = {
  name: 'Empty state — renderEmptyState wins over emptyStateMessage',
  parameters: {
    docs: {
      description: {
        story:
          '`renderEmptyState` takes precedence over `emptyStateMessage` / `emptyStateIcon`. Both props are passed here but only the render-prop output is shown — handy when staged rollouts gradually replace the legacy message-only API.',
      },
    },
  },
  args: {
    items: [],
    onItemClick: noop,
    emptyStateIcon: 'search-x',
    emptyStateMessage: 'This default message is intentionally suppressed by renderEmptyState.',
    renderEmptyState: () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 250,
          fontSize: 12,
          color: 'var(--canvas-foreground)',
        }}
      >
        Render-prop output wins.
      </div>
    ),
  },
  render: (args) => (
    <>
      <StoryInfoPanel
        title="Render-prop precedence"
        description={
          'Both `emptyStateMessage` and `renderEmptyState` are supplied. The render ' +
          'prop wins — the default message is suppressed, the custom node is shown ' +
          'instead. Useful when migrating an existing surface from the message-only ' +
          'API to the render-prop API.'
        }
      />
      <PanelWrapper>
        <ListView {...args} />
      </PanelWrapper>
    </>
  ),
};
