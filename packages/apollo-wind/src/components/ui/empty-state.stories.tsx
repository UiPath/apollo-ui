import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileX, Inbox, Search, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { EmptyState } from './empty-state';
import { Button } from './button';

const meta = {
  title: 'Components/Feedback/Empty State',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic examples
// ============================================================================

export const Default: Story = {
  args: {
    title: 'No data found',
    description: 'Get started by creating your first item.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <FileX className="h-10 w-10 text-muted-foreground" />,
    title: 'No files found',
    description: 'Upload your first file to get started with organizing your documents.',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Inbox className="h-10 w-10 text-muted-foreground" />,
    title: 'No messages',
    description: 'Your inbox is empty. Start a conversation to see messages here.',
    action: {
      label: 'New Message',
      onClick: () => alert('Create new message'),
    },
  },
};

export const WithMultipleActions: Story = {
  args: {
    icon: <Users className="h-10 w-10 text-muted-foreground" />,
    title: 'No team members',
    description: 'Invite team members to collaborate on this project.',
    action: {
      label: 'Invite Members',
      onClick: () => alert('Invite members'),
    },
    secondaryAction: {
      label: 'Learn More',
      onClick: () => alert('Learn more'),
    },
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: <Search className="h-10 w-10 text-muted-foreground" />,
    title: 'No results found',
    description: "Try adjusting your search or filter to find what you're looking for.",
    action: {
      label: 'Clear Search',
      onClick: () => alert('Clear search'),
    },
  },
};

export const EmptyCart: Story = {
  args: {
    icon: <ShoppingCart className="h-10 w-10 text-muted-foreground" />,
    title: 'Your cart is empty',
    description: 'Add items to your cart to continue shopping.',
    action: {
      label: 'Browse Products',
      onClick: () => alert('Browse products'),
    },
  },
};

export const MinimalNoIcon: Story = {
  args: {
    title: 'Nothing here yet',
    description: 'Content will appear here once available.',
  },
};

export const LongDescription: Story = {
  args: {
    icon: <FileX className="h-10 w-10 text-muted-foreground" />,
    title: 'No documents uploaded',
    description:
      'Upload documents to keep all your important files in one place. You can upload PDFs, Word documents, spreadsheets, and more. Drag and drop files or click the button below to get started.',
    action: {
      label: 'Upload Documents',
      onClick: () => alert('Upload documents'),
    },
  },
};

// ============================================================================
// Status code examples
// ============================================================================

/** Displays a prominent status code above the title — useful for error pages. */
export const WithStatusCode: Story = {
  name: 'With Status Code',
  args: {
    code: '404',
    title: "Uh oh! Can't find it",
    description:
      "The page you're looking for may have been removed, had its name changed, or is temporarily unavailable.",
  },
};

// ============================================================================
// Children-based actions (composable pattern)
// ============================================================================

/** When more than two actions are needed, pass Button components as children. */
export const ComposableActions: Story = {
  name: 'Composable Actions',
  render: () => (
    <EmptyState
      icon={<AlertTriangle className="h-10 w-10 text-muted-foreground" />}
      title="No Projects Yet"
      description="You haven't created any projects yet. Get started by creating your first project."
    >
      <Button>Create project</Button>
      <Button variant="outline">Import project</Button>
      <Button variant="outline">Learn More</Button>
    </EmptyState>
  ),
};

// ============================================================================
// Rich media (video / illustration)
// ============================================================================

const VIMEO_SRC =
  'https://player.vimeo.com/video/1145746394?h=3c42d6f39b&autoplay=1&muted=1&loop=1&background=1';

function VideoCircle({ size = 180 }: { size?: number }) {
  const iframeSize = size + 120;
  const offset = -(iframeSize - size) / 2;

  return (
    <div
      className="overflow-hidden rounded-full border border-border bg-muted"
      style={{ width: size, height: size }}
    >
      <iframe
        src={VIMEO_SRC}
        width={iframeSize}
        height={iframeSize}
        allow="autoplay"
        title="Decorative animation"
        className="pointer-events-none border-0"
        style={{ marginTop: offset, marginLeft: offset, transform: 'scale(1.15)' }}
      />
    </div>
  );
}

/** The icon prop accepts any ReactNode — including rich media like videos or illustrations. */
export const WithVideo: Story = {
  name: 'With Video',
  render: () => (
    <EmptyState
      icon={<VideoCircle />}
      code="404"
      title="Uh oh! Can't find it"
      description="The page you're looking for may have been removed, had its name changed, or is temporarily unavailable."
    >
      <Button>Take me home</Button>
    </EmptyState>
  ),
};
