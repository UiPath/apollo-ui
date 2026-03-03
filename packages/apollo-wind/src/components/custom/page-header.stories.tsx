import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { PageHeader } from './page-header';

const meta = {
  title: 'Components/UiPath/Page Header',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const TitleOnly: Story = {
  name: 'Title only',
  args: { title: '' },
  render: () => (
    <div className="future-dark bg-surface">
      <PageHeader title="Manage access" />
    </div>
  ),
};

export const WithBreadcrumb: Story = {
  name: 'With breadcrumb',
  args: { title: '' },
  render: () => (
    <div className="future-dark bg-surface">
      <PageHeader
        title="Manage access"
        breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']}
      />
    </div>
  ),
};

export const WithActions: Story = {
  name: 'With actions',
  args: { title: '' },
  render: () => (
    <div className="future-dark bg-surface">
      <PageHeader
        title="Manage access"
        breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']}
        actions={
          <>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground-accent transition-colors hover:bg-surface-hover">
              Check access
            </button>
            <button className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-foreground-on-accent transition-colors hover:bg-brand/90">
              Assign role
            </button>
          </>
        }
      />
    </div>
  ),
};

export const WithTabs: Story = {
  name: 'With tabs',
  args: { title: '' },
  render: () => {
    const [activeTab, setActiveTab] = React.useState('assignments');
    return (
      <div className="future-dark bg-surface">
        <PageHeader
          title="Manage access"
          breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']}
          actions={
            <>
              <button className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground-accent transition-colors hover:bg-surface-hover">
                Check access
              </button>
              <button className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-foreground-on-accent transition-colors hover:bg-brand/90">
                Assign role
              </button>
            </>
          }
          tabs={[
            { value: 'assignments', label: 'Role assignments' },
            { value: 'roles', label: 'Roles' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  },
};
