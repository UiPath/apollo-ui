import type { Meta } from '@storybook/react-vite';
import { Badge } from './badge';
import { Spinner } from './spinner';

const meta: Meta<typeof Badge> = {
  title: 'Components/Data Display/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <div className="flex items-center gap-2">
      <Badge>Badge</Badge>
    </div>
  ),
};

// ============================================================================
// Variants
// ============================================================================

export const Variants = {
  name: 'Variants',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// ============================================================================
// With Spinner
// ============================================================================

export const WithSpinner = {
  name: 'With Spinner',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default" className="gap-1.5">
        <Spinner size="sm" className="h-3 w-3" />
        Processing
      </Badge>
      <Badge variant="secondary" className="gap-1.5">
        <Spinner size="sm" className="h-3 w-3" />
        Syncing
      </Badge>
      <Badge variant="outline" className="gap-1.5">
        <Spinner size="sm" className="h-3 w-3" />
        Loading
      </Badge>
    </div>
  ),
};

// ============================================================================
// Link
// ============================================================================

export const Link = {
  name: 'Link',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <a href="#" className="no-underline">
        <Badge variant="default" className="cursor-pointer">Default</Badge>
      </a>
      <a href="#" className="no-underline">
        <Badge variant="secondary" className="cursor-pointer">Secondary</Badge>
      </a>
      <a href="#" className="no-underline">
        <Badge variant="destructive" className="cursor-pointer">Destructive</Badge>
      </a>
      <a href="#" className="no-underline">
        <Badge variant="outline" className="cursor-pointer">Outline</Badge>
      </a>
    </div>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Status indicators */}
      <div>
        <p className="text-sm font-medium mb-3">Status Indicators</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            Active
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Idle
          </Badge>
          <Badge variant="destructive" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
            Error
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Pending
          </Badge>
        </div>
      </div>

      {/* In a list */}
      <div>
        <p className="text-sm font-medium mb-3">In a List</p>
        <div className="w-full max-w-md space-y-2">
          {[
            { name: 'Invoice Processing', status: 'Active', variant: 'default' as const },
            { name: 'Email Automation', status: 'Paused', variant: 'secondary' as const },
            { name: 'Data Migration', status: 'Failed', variant: 'destructive' as const },
            { name: 'Report Generator', status: 'Draft', variant: 'outline' as const },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <Badge variant={item.variant}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm font-medium mb-3">Tags</p>
        <div className="flex flex-wrap items-center gap-2">
          {['React', 'TypeScript', 'Tailwind', 'Radix UI', 'Storybook'].map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Notification count */}
      <div>
        <p className="text-sm font-medium mb-3">Notification Count</p>
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="text-sm font-medium">Inbox</span>
            <Badge className="absolute -top-2 -right-6 h-5 min-w-5 justify-center px-1.5 text-[10px]">3</Badge>
          </div>
          <div className="relative">
            <span className="text-sm font-medium">Alerts</span>
            <Badge variant="destructive" className="absolute -top-2 -right-7 h-5 min-w-5 justify-center px-1.5 text-[10px]">12</Badge>
          </div>
          <div className="relative">
            <span className="text-sm font-medium">Tasks</span>
            <Badge variant="secondary" className="absolute -top-2 -right-8 h-5 min-w-5 justify-center px-1.5 text-[10px]">99+</Badge>
          </div>
        </div>
      </div>
    </div>
  ),
};
