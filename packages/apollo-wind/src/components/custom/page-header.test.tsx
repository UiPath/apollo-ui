import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title as a heading', () => {
    render(<PageHeader title="Manage access" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Manage access' })).toBeInTheDocument();
  });

  it('renders the description below the title', () => {
    render(<PageHeader title="Manage access" description="Control who can see what" />);
    expect(screen.getByText('Control who can see what')).toBeInTheDocument();
  });

  it('renders breadcrumb segments with the last one highlighted', () => {
    render(
      <PageHeader title="Manage access" breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']} />
    );
    expect(screen.getByText('POPoC')).toBeInTheDocument();
    expect(screen.getByText('DefaultTenant')).toBeInTheDocument();
    const lastCrumb = screen.getAllByText('Manage access').find((el) => el.tagName === 'SPAN');
    expect(lastCrumb).toHaveClass('text-foreground');
  });

  it('renders action buttons', () => {
    render(
      <PageHeader
        title="Manage access"
        actions={
          <button type="button" data-testid="assign-role">
            Assign role
          </button>
        }
      />
    );
    expect(screen.getByTestId('assign-role')).toBeInTheDocument();
  });

  it('renders tabs and marks the active one', () => {
    render(
      <PageHeader
        title="Manage access"
        tabs={[
          { value: 'assignments', label: 'Role assignments' },
          { value: 'roles', label: 'Roles' },
        ]}
        activeTab="assignments"
      />
    );
    expect(screen.getByRole('button', { name: 'Role assignments' })).toHaveClass('border-brand');
    expect(screen.getByRole('button', { name: 'Roles' })).not.toHaveClass('border-brand');
  });

  it('fires onTabChange with the clicked tab value', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <PageHeader
        title="Manage access"
        tabs={[
          { value: 'assignments', label: 'Role assignments' },
          { value: 'roles', label: 'Roles' },
        ]}
        activeTab="assignments"
        onTabChange={onTabChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Roles' }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('roles');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PageHeader
        title="Manage access"
        breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']}
        tabs={[
          { value: 'assignments', label: 'Role assignments' },
          { value: 'roles', label: 'Roles' },
        ]}
        activeTab="assignments"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
