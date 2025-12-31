import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileX, Inbox, Search, ShoppingCart, Users } from 'lucide-react';
import { EmptyState } from './empty-state';

const meta = {
  title: 'Design System/Feedback/Empty State',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

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
