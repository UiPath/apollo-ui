import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';
import { MaestroHeader } from '@/components/custom/global-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ErrorVideo } from './error-components';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Future/Empty & Errors',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared page layout
// ============================================================================

function ErrorPageLayout({
  theme,
  children,
}: {
  theme: string;
  children: React.ReactNode;
}) {
  const themeClass =
    theme === 'core-dark'
      ? 'core-dark'
      : theme === 'core-light'
        ? 'core-light'
        : theme === 'wireframe'
          ? 'wireframe'
          : theme === 'vertex'
            ? 'vertex'
            : theme === 'canvas'
              ? 'canvas'
              : theme === 'light'
                ? 'future-light'
                : 'future-dark';

  return (
    <div
      className={cn(themeClass, 'flex h-screen flex-col bg-surface')}
      style={{ fontFamily: fontFamily.base }}
    >
      <MaestroHeader theme={theme as import('@/foundation/Future/types').FutureTheme} title="UiPath" />
      <div className="flex flex-1 flex-col items-center justify-center">
        {children}
      </div>
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
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="Error"
        description="The page you're looking for doesn't exist or has been moved."
      >
        <Button>Return home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for invalid requests. */
export const BadRequest400: Story = {
  name: '400 - Bad Request',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="400"
        title="Bad Request"
        description="The request was invalid. Please go home and try again."
      >
        <Button>Take me home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for unauthorized access to Task Mining. */
export const Unauthorized401: Story = {
  name: '401 - Unauthorized',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="401"
        title="Unauthorized"
        description="You don't have permission to view Task Mining. Please contact your administrator for necessary permissions."
      >
        <Button>Take me home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for forbidden access to Orchestrator. */
export const Forbidden403: Story = {
  name: '403 - Forbidden',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="403"
        title="Oops! You're not on the list"
        description="You don't have permission to view Orchestrator. Please contact your administrator for necessary permissions."
      >
        <Button>Take me home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for pages that cannot be found. */
export const NotFound404: Story = {
  name: '404 - Not Found',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="404"
        title="Uh oh! Can't find it"
        description="The page you're looking for may have been removed, had its name changed, or is temporarily unavailable."
      >
        <Button>Take me home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for internal server errors. */
export const ServerError500: Story = {
  name: '500 - Server Error',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="500"
        title="Server error"
        description="The server encountered an internal error and was unable to complete your request. Please go home and try again."
      >
        <Button>Take me home</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for maintenance mode. */
export const ServiceUnavailable503: Story = {
  name: '503 - Service Unavailable',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        code="503"
        title="We will be back up soon"
        description="The system is under maintenance. Watch this space for updates."
      >
        <Button>Check service status</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Loading state error page with refresh message. */
export const ErrorLoading: Story = {
  name: 'Error Loading',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="Please wait while we set up things for you"
        description="This could take a few minutes. The page will refresh when the platform is ready to use."
      />
    </ErrorPageLayout>
  ),
};

/** Error page for unsupported browsers. */
export const BrowserNotSupported: Story = {
  name: 'Browser Not Supported',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="This browser is not supported"
      >
        <Button>Learn more</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page for IP-based access restrictions. */
export const IpRestricted: Story = {
  name: 'IP Restricted',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="Access restricted"
        description="Due to organizational policies, you can't access Orchestrator from this network location. Please contact your administrator."
      >
        <Button>Back to website</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Error page variant without default actions, for Task Mining unauthorized access. */
export const HideDefaultActions: Story = {
  name: 'Hide Default Actions',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="Unauthorized"
        description="You don't have permission to view Task Mining. Please contact your administrator for necessary permissions."
      >
        <Button>Back to website</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};

/** Empty state page for when no projects exist. */
export const NoProjectsYet: Story = {
  name: 'No Projects Yet',
  render: (_, { globals }) => (
    <ErrorPageLayout theme={globals.futureTheme || 'dark'}>
      <EmptyState
        icon={<ErrorVideo />}
        title="No Projects Yet"
        description="You haven't created any projects yet. Get started by creating your first project."
      >
        <Button>Create project</Button>
        <Button variant="outline">Import project</Button>
        <Button variant="outline">Learn More</Button>
      </EmptyState>
    </ErrorPageLayout>
  ),
};
