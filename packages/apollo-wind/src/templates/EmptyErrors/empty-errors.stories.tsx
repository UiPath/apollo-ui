import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Empty & Errors',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared placeholder
// ============================================================================

function ComingSoon({ theme, label }: { theme: string; label: string }) {
  const themeClass = theme === 'light' ? 'future-light' : 'future-dark';

  return (
    <div
      className={cn(themeClass, 'flex h-screen flex-col items-center justify-center gap-3 bg-future-surface')}
      style={{ fontFamily: fontFamily.base }}
    >
      <p className="text-sm font-medium text-future-foreground">{label}</p>
      <p className="text-sm text-future-foreground-muted">Coming soon</p>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/** Generic error page for pages that don't exist or have been moved. */
export const Error: Story = {
  name: 'Error',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="Error" />
  ),
};

/** Error page for invalid requests. */
export const BadRequest400: Story = {
  name: '400 - Bad Request',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="400 - Bad Request" />
  ),
};

/** Error page for unauthorized access to Task Mining. */
export const Unauthorized401: Story = {
  name: '401 - Unauthorized',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="401 - Unauthorized" />
  ),
};

/** Error page for forbidden access to Orchestrator. */
export const Forbidden403: Story = {
  name: '403 - Forbidden',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="403 - Forbidden" />
  ),
};

/** Error page for pages that cannot be found. */
export const NotFound404: Story = {
  name: '404 - Not Found',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="404 - Not Found" />
  ),
};

/** Error page for internal server errors. */
export const ServerError500: Story = {
  name: '500 - Server Error',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="500 - Server Error" />
  ),
};

/** Error page for maintenance mode. */
export const ServiceUnavailable503: Story = {
  name: '503 - Service Unavailable',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="503 - Service Unavailable" />
  ),
};

/** Loading state error page with refresh message. */
export const ErrorLoading: Story = {
  name: 'Error Loading',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="Error Loading" />
  ),
};

/** Error page for unsupported browsers. */
export const BrowserNotSupported: Story = {
  name: 'Browser Not Supported',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="Browser Not Supported" />
  ),
};

/** Error page for IP-based access restrictions. */
export const IpRestricted: Story = {
  name: 'IP Restricted',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="IP Restricted" />
  ),
};

/** Error page variant without default actions, for Task Mining unauthorized access. */
export const HideDefaultActions: Story = {
  name: 'Hide Default Actions',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="Hide Default Actions" />
  ),
};

/** Empty state page for when no projects exist. */
export const NoProjectsYet: Story = {
  name: 'No Projects Yet',
  render: (_, { globals }) => (
    <ComingSoon theme={globals.futureTheme || 'dark'} label="No Projects Yet" />
  ),
};
