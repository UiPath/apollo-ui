import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  ChevronDown,
  CreditCard,
  DollarSign,
  Download,
  SquareMenu,
  Users,
} from 'lucide-react';
import * as React from 'react';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { Grid, GridItem, MaestroTemplate } from './template-maestro';

// ============================================================================
// Sample left-panel navigation
// ============================================================================

/**
 * Simple left-panel nav — 5 text-only buttons, no icons.
 * Used in the collapsible side panel.
 */
function LeftPanelNav() {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
      <div className="flex flex-col gap-1">
        {['Button', 'Button', 'Button', 'Button', 'Button'].map((label, i) => (
          <button
            key={i}
            className="flex h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Full menu nav — icons, divider, expandable "More" section.
 * Used in the global header's slide-out overlay menu.
 */
function MenuNav() {
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
      {/* Primary nav items */}
      <div className="flex flex-col gap-1">
        {['Button', 'Button', 'Button', 'Button', 'Button'].map((label, i) => (
          <button
            key={i}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <SquareMenu className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="my-2 border-t border-border-subtle" />

      {/* More — expand / collapse */}
      <div className="flex flex-col gap-1">
        <button
          className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-expanded={moreOpen}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
          />
          <span className="truncate">More</span>
        </button>

        {moreOpen && (
          <div className="flex flex-col gap-1 pl-2">
            {['Button', 'Button', 'Button', 'Button', 'Button'].map((label, i) => (
              <button
                key={i}
                className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <SquareMenu className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

// ============================================================================
// Sample right-panel content (p-6 applied by child, not the panel)
// ============================================================================

function RightPanelContent() {
  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <RightPanelCard
        title="Title"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque interdum interdum nunc."
        actionLabel="Button"
      />
      <RightPanelCard
        title="Title"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque interdum interdum nunc."
        actionLabel="Button"
      />
    </div>
  );
}

function RightPanelCard({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-5 text-foreground-muted">{description}</p>
      {actionLabel && (
        <button className="flex h-9 w-fit items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Sample main content — uses canvas-responsive Grid/GridItem
// ============================================================================

function FullWidthCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-6">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <button className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
        View All
      </button>
    </div>
  );
}

function ColumnCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-6">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
    </div>
  );
}

/** 4-column row — GridItem defaults to cols=3 (12/3 = 4 per row) */
function FourColumnGrid() {
  return (
    <Grid>
      <GridItem>
        <ColumnCard title="Column" subtitle="Description" />
      </GridItem>
      <GridItem>
        <ColumnCard title="Column" subtitle="Description" />
      </GridItem>
      <GridItem>
        <ColumnCard title="Column" subtitle="Description" />
      </GridItem>
      <GridItem>
        <ColumnCard title="Column" subtitle="Description" />
      </GridItem>
    </Grid>
  );
}

// ============================================================================
// Badge
// ============================================================================

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
      {label}
    </span>
  );
}

// ============================================================================
// Featured card — image left, badges, title, description, button
// ============================================================================

function FeaturedCard({
  badge1 = 'Badge',
  badge2 = 'Badge',
  title = 'Title',
  description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque interdum interdum nunc.',
  actionLabel = 'Button',
}: {
  badge1?: string;
  badge2?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-6">
      {/* Badges */}
      <div className="flex gap-2">
        <Badge label={badge1} />
        <Badge label={badge2} />
      </div>

      {/* Image + content */}
      <div className="flex gap-4">
        <img
          src="https://images.ctfassets.net/5965pury2lcm/145el1SuDOOTj7t61htNHe/11ab290de043018bc89fb0bbca017489/Solutions_%C3%A2___byIndustry_01.jpg"
          alt="Card"
          className="h-[42px] w-[42px] shrink-0 rounded-lg object-cover"
        />

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-5 text-foreground-muted">{description}</p>
          <div className="mt-1 flex justify-end">
            <button className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground">
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simplified card — title, description, right-aligned button (no badges or image). */
function SimpleCard({
  title = 'Title',
  description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque interdum interdum nunc.',
  actionLabel = 'Button',
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-5 text-foreground-muted">{description}</p>
      <div className="mt-1 flex justify-end">
        <button className="flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Sample data table
// ============================================================================

type TableRow = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Pending';
  type: string;
  lastModified: string;
  owner: string;
};

const sampleTableData: TableRow[] = [
  {
    id: '1',
    name: 'Automation Alpha',
    status: 'Active',
    type: 'Process',
    lastModified: '2026-02-01',
    owner: 'Alice',
  },
  {
    id: '2',
    name: 'Bot Bravo',
    status: 'Inactive',
    type: 'Task',
    lastModified: '2026-01-28',
    owner: 'Bob',
  },
  {
    id: '3',
    name: 'Connector Charlie',
    status: 'Active',
    type: 'Integration',
    lastModified: '2026-02-03',
    owner: 'Charlie',
  },
  {
    id: '4',
    name: 'Dashboard Delta',
    status: 'Pending',
    type: 'Process',
    lastModified: '2026-01-15',
    owner: 'Diana',
  },
  {
    id: '5',
    name: 'Engine Echo',
    status: 'Active',
    type: 'Task',
    lastModified: '2026-02-05',
    owner: 'Eve',
  },
  {
    id: '6',
    name: 'Flow Foxtrot',
    status: 'Active',
    type: 'Integration',
    lastModified: '2026-01-20',
    owner: 'Frank',
  },
  {
    id: '7',
    name: 'Gateway Golf',
    status: 'Inactive',
    type: 'Process',
    lastModified: '2026-01-10',
    owner: 'Grace',
  },
  {
    id: '8',
    name: 'Hub Hotel',
    status: 'Pending',
    type: 'Task',
    lastModified: '2026-02-04',
    owner: 'Hank',
  },
];

const sampleTableColumns: ColumnDef<TableRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="text-foreground">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const color =
        status === 'Active'
          ? 'text-green-400'
          : status === 'Pending'
            ? 'text-yellow-400'
            : 'text-foreground-muted';
      return <span className={color}>{status}</span>;
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <span className="text-foreground-muted">{row.getValue('type')}</span>,
  },
  {
    accessorKey: 'lastModified',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Modified" />,
    cell: ({ row }) => (
      <span className="text-foreground-muted">{row.getValue('lastModified')}</span>
    ),
  },
  {
    accessorKey: 'owner',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    cell: ({ row }) => (
      <span className="text-foreground-muted">{row.getValue('owner')}</span>
    ),
  },
];

// ============================================================================
// Left Panel Collapsed page content
// ============================================================================

function LeftPanelCollapsedContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero image */}
      <img
        src="https://images.ctfassets.net/5965pury2lcm/145el1SuDOOTj7t61htNHe/11ab290de043018bc89fb0bbca017489/Solutions_%C3%A2___byIndustry_01.jpg"
        alt="Hero"
        className="w-full rounded-xl border border-border-subtle object-cover"
        style={{ height: 250 }}
      />

      {/* Section 1 — 2 featured cards */}
      <SectionHeader title="Title" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FeaturedCard />
        <FeaturedCard />
      </div>

      {/* Section 2 — 3 simple cards */}
      <SectionHeader title="Title" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SimpleCard />
        <SimpleCard />
        <SimpleCard />
      </div>

      {/* Section 3 — Data table */}
      <SectionHeader title="Title" />
      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <DataTable
          columns={sampleTableColumns}
          data={sampleTableData}
          searchKey="name"
          searchPlaceholder="Filter by name..."
          showColumnToggle
          showPagination
          pageSize={5}
        />
      </div>

      {/* Section 4 — 4-column grid */}
      <SectionHeader title="Title" />
      <FourColumnGrid />
    </div>
  );
}

// ============================================================================
// Storybook meta
// ============================================================================

const meta = {
  title: 'Templates/Maestro',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Landing: Story = {
  name: 'Landing',
  render: (_, { globals }) => (
    <MaestroTemplate
      theme={globals.futureTheme || 'dark'}
      leftPanelContent={<LeftPanelNav />}
      menuContent={<MenuNav />}
      rightPanelContent={<RightPanelContent />}
    >
      <LeftPanelCollapsedContent />
    </MaestroTemplate>
  ),
};

// ============================================================================
// Dashboard content
// ============================================================================

const dashboardTabs = ['Overview', 'Analytics', 'Reports'];

const dashboardStats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Subscriptions',
    value: '+2,350',
    change: '+180.1% from last month',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Sales',
    value: '+12,234',
    change: '+19% from last month',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: 'Active Now',
    value: '+573',
    change: '+201 since last hour',
    icon: <Activity className="h-4 w-4" />,
  },
];

type TransactionRow = {
  id: string;
  customer: string;
  email: string;
  type: 'Sale' | 'Refund' | 'Subscription' | 'Payout';
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
  amount: string;
  date: string;
  details: string;
};

const transactionData: TransactionRow[] = [
  {
    id: 'TXN-001',
    customer: 'Liam Johnson',
    email: 'liam@example.com',
    type: 'Sale',
    status: 'Completed',
    amount: '$250.00',
    date: '2026-02-05',
    details: 'Enterprise license — annual plan',
  },
  {
    id: 'TXN-002',
    customer: 'Olivia Smith',
    email: 'olivia@example.com',
    type: 'Subscription',
    status: 'Completed',
    amount: '$150.00',
    date: '2026-02-04',
    details: 'Pro plan — monthly renewal',
  },
  {
    id: 'TXN-003',
    customer: 'Noah Williams',
    email: 'noah@example.com',
    type: 'Sale',
    status: 'Processing',
    amount: '$350.00',
    date: '2026-02-04',
    details: 'Team license — 5 seats',
  },
  {
    id: 'TXN-004',
    customer: 'Emma Brown',
    email: 'emma@example.com',
    type: 'Refund',
    status: 'Completed',
    amount: '-$45.00',
    date: '2026-02-03',
    details: 'Partial refund — unused credits',
  },
  {
    id: 'TXN-005',
    customer: 'James Jones',
    email: 'james@example.com',
    type: 'Sale',
    status: 'Completed',
    amount: '$89.00',
    date: '2026-02-03',
    details: 'Starter plan — annual',
  },
  {
    id: 'TXN-006',
    customer: 'Sophia Garcia',
    email: 'sophia@example.com',
    type: 'Payout',
    status: 'Pending',
    amount: '$1,200.00',
    date: '2026-02-02',
    details: 'Partner payout — January',
  },
  {
    id: 'TXN-007',
    customer: 'Benjamin Miller',
    email: 'ben@example.com',
    type: 'Subscription',
    status: 'Completed',
    amount: '$29.00',
    date: '2026-02-02',
    details: 'Basic plan — monthly renewal',
  },
  {
    id: 'TXN-008',
    customer: 'Mia Davis',
    email: 'mia@example.com',
    type: 'Sale',
    status: 'Failed',
    amount: '$450.00',
    date: '2026-02-01',
    details: 'Enterprise license — payment declined',
  },
  {
    id: 'TXN-009',
    customer: 'Lucas Wilson',
    email: 'lucas@example.com',
    type: 'Sale',
    status: 'Completed',
    amount: '$199.00',
    date: '2026-02-01',
    details: 'Pro plan — annual',
  },
  {
    id: 'TXN-010',
    customer: 'Charlotte Moore',
    email: 'charlotte@example.com',
    type: 'Subscription',
    status: 'Processing',
    amount: '$59.00',
    date: '2026-01-31',
    details: 'Team plan — monthly renewal',
  },
];

const transactionColumns: ColumnDef<TransactionRow, unknown>[] = [
  DataTableSelectColumn<TransactionRow>(),
  {
    accessorKey: 'customer',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {row.getValue('customer')}
        </span>
        <span className="text-xs text-foreground-muted">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const colors: Record<string, string> = {
        Sale: 'bg-green-500/10 text-green-400',
        Refund: 'bg-red-500/10 text-red-400',
        Subscription: 'bg-blue-500/10 text-blue-400',
        Payout: 'bg-yellow-500/10 text-yellow-400',
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] ?? ''}`}
        >
          {type}
        </span>
      );
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const colors: Record<string, string> = {
        Completed: 'text-green-400',
        Pending: 'text-yellow-400',
        Processing: 'text-blue-400',
        Failed: 'text-red-400',
      };
      return (
        <span className={`text-sm ${colors[status] ?? 'text-foreground-muted'}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">{row.getValue('amount')}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-sm text-foreground-muted">{row.getValue('date')}</span>
    ),
  },
];

const recentActivity = [
  {
    initials: 'LJ',
    name: 'Liam Johnson',
    action: 'Purchased Enterprise license',
    time: '2 min ago',
  },
  { initials: 'OS', name: 'Olivia Smith', action: 'Renewed Pro subscription', time: '15 min ago' },
  { initials: 'NW', name: 'Noah Williams', action: 'Added 3 team members', time: '1 hour ago' },
  { initials: 'EB', name: 'Emma Brown', action: 'Requested a refund', time: '2 hours ago' },
  { initials: 'JJ', name: 'James Jones', action: 'Upgraded to annual plan', time: '5 hours ago' },
];

const monthlyGoals = [
  { label: 'Revenue Target', current: 45231, target: 60000, unit: '$' },
  { label: 'New Subscriptions', current: 2350, target: 3000 },
  { label: 'Customer Retention', current: 92, target: 100, unit: '%' },
  { label: 'Support Tickets Resolved', current: 187, target: 200 },
];

function DashboardContent() {
  const [activeTab, setActiveTab] = React.useState('Overview');

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {dashboardTabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-brand text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' ? (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat) => (
              <div
                key={stat.title}
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-muted">
                    {stat.title}
                  </span>
                  <span className="text-foreground-subtle">{stat.icon}</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-foreground-muted">{stat.change}</span>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
              <button className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground-muted transition-colors hover:border-border-hover hover:text-foreground">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-4">
              <DataTable
                columns={transactionColumns}
                data={transactionData}
                searchKey="customer"
                searchPlaceholder="Search transactions..."
                showColumnToggle
                showPagination
                pageSize={5}
              />
            </div>
          </div>

          {/* Bottom two cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <div className="flex flex-col rounded-xl border border-border-subtle bg-surface">
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                <button className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
                  View all
                </button>
              </div>
              <div className="flex flex-col">
                {recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b border-border-subtle px-6 py-3 last:border-b-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-foreground">
                      {item.initials}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="text-xs text-foreground-muted">{item.action}</span>
                    </div>
                    <span className="text-xs text-foreground-subtle">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Goals */}
            <div className="flex flex-col rounded-xl border border-border-subtle bg-surface">
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <h3 className="text-base font-semibold text-foreground">Monthly Goals</h3>
                <button className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-5 p-6">
                {monthlyGoals.map((goal) => {
                  const pct = Math.round((goal.current / goal.target) * 100);
                  const fmt = (n: number) =>
                    goal.unit === '$'
                      ? `$${n.toLocaleString()}`
                      : goal.unit === '%'
                        ? `${n}%`
                        : n.toLocaleString();
                  return (
                    <div key={goal.label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {goal.label}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {fmt(goal.current)} / {fmt(goal.target)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2 bg-surface-overlay [&>div]:bg-brand"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-foreground-muted">
          Coming soon
        </div>
      )}
    </div>
  );
}

export const Dashboard: Story = {
  name: 'Dashboard',
  render: (_, { globals }) => (
    <MaestroTemplate
      theme={globals.futureTheme || 'dark'}
      defaultLeftPanelCollapsed
      defaultRightPanelCollapsed
      leftPanelContent={<LeftPanelNav />}
      menuContent={<MenuNav />}
      rightPanelContent={<RightPanelContent />}
    >
      <DashboardContent />
    </MaestroTemplate>
  ),
};
