import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChevronDown,
  ChevronRight,
  Code,
  EllipsisVertical,
  Folder,
  Globe,
  Pencil,
  SquareMenu,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { PageHeader } from '@/components/custom/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import TreeView, { type TreeViewIconMap, type TreeViewItem } from '@/components/ui/tree-view';
import { StudioGrid, StudioGridItem, StudioTemplate } from './template-studio';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Studio',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Panel view helpers
// ============================================================================

function PanelView({ index }: { index: number }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Title {index}</h3>
        <p className="mt-1 text-xs text-foreground-muted">Sub description</p>
      </div>
      <div className="border-t border-border-subtle" />
      <div className="px-4 py-3">
        <p className="text-xs text-foreground-muted">Panel content placeholder.</p>
      </div>
    </div>
  );
}

// ============================================================================
// Explorer panel view
// ============================================================================

const explorerData: TreeViewItem[] = [
  {
    id: 'root',
    name: 'POPoC',
    type: 'region',
    children: [
      { id: 'tenants', name: 'Tenants', type: 'folder', children: [] },
      { id: 'services', name: 'Services', type: 'folder', children: [] },
    ],
  },
  {
    id: 'root-2',
    name: 'Enterprise',
    type: 'enterprise',
    children: [
      { id: 'tenants-2', name: 'Tenants', type: 'folder', children: [] },
      { id: 'services-2', name: 'Services', type: 'folder', children: [] },
    ],
  },
  {
    id: 'maestro',
    name: 'Maestro',
    type: 'tenant',
    meta: 'Default',
  },
  {
    id: 'staging',
    name: 'Staging',
    type: 'tenant',
    badge: (
      <Badge variant="secondary" className="text-xs">
        Staging
      </Badge>
    ),
  },
  { id: 'tenant', name: 'Tenant', type: 'tenant' },
  {
    id: 'root-3',
    name: 'Workflow',
    type: 'enterprise',
    children: [
      {
        id: 'tenants-3',
        name: 'Tenants',
        type: 'folder',
        children: [
          {
            id: 'workflow-maestro',
            name: 'Maestro',
            type: 'tenant',
            badge: (
              <Badge variant="secondary" className="text-xs">
                Canary
              </Badge>
            ),
            meta: 'Production',
            actions: [
              {
                id: 'edit',
                icon: <Pencil className="h-3.5 w-3.5" />,
                label: 'Edit',
                onClick: (item: TreeViewItem) => console.log('Edit', item.name),
              },
              {
                id: 'delete',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                label: 'Delete',
                onClick: (item: TreeViewItem) => console.log('Delete', item.name),
              },
            ],
          },
          { id: 'workflow-flow', name: 'Flow', type: 'tenant', meta: '2 workflows' },
          {
            id: 'workflow-delegate',
            name: 'Delegate',
            type: 'tenant',
            badge: (
              <Badge variant="outline" className="text-xs">
                New
              </Badge>
            ),
          },
          { id: 'workflow-admin', name: 'Admin', type: 'tenant' },
          {
            id: 'workflow-admin-east',
            name: 'Admin East',
            type: 'tenant',
            disabled: true,
            meta: 'Maintenance',
          },
          { id: 'workflow-admin-west', name: 'Admin West', type: 'tenant' },
        ],
      },
      {
        id: 'services-3',
        name: 'Services',
        type: 'folder',
        children: [
          { id: 'workflow-svc-maestro', name: 'Maestro', type: 'service', meta: 'v2.4.1' },
          {
            id: 'workflow-svc-flow',
            name: 'Flow',
            type: 'service',
            badge: (
              <Badge variant="destructive" className="text-xs">
                Beta
              </Badge>
            ),
          },
          { id: 'workflow-svc-delegate', name: 'Delegate', type: 'service' },
          { id: 'workflow-svc-admin', name: 'Admin', type: 'service' },
          { id: 'workflow-svc-admin-east', name: 'Admin East', type: 'service' },
          { id: 'workflow-svc-admin-west', name: 'Admin West', type: 'service' },
        ],
      },
    ],
  },
];

const explorerIconMap: TreeViewIconMap = {
  region: <Globe className="h-4 w-4 text-foreground-muted" />,
  enterprise: <Folder className="h-4 w-4 text-foreground-muted" />,
  folder: <Code className="h-4 w-4 text-foreground-muted" />,
  tenant: <Globe className="h-4 w-4 text-foreground-accent/80" />,
  service: <Code className="h-4 w-4 text-foreground-accent/80" />,
};

function ExplorerPanelView() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Explorer</h3>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <TreeView
          data={explorerData}
          iconMap={explorerIconMap}
          containerClassName="p-4 w-full max-w-full border-0 rounded-none shadow-none bg-transparent"
          searchPlaceholder="Search tenants..."
          showExpandAll
          showSelectionCheckboxes
        />
      </div>
    </div>
  );
}

// Left panel: icon 0 = Explorer; icons 1–4 = numbered placeholders
const leftPanelViews = [
  <ExplorerPanelView key="explorer" />,
  <PanelView key="left-1" index={1} />,
  <PanelView key="left-2" index={2} />,
  <PanelView key="left-3" index={3} />,
  <PanelView key="left-4" index={4} />,
];

// Right panel: icons 0–4 = numbered placeholders
const rightPanelViews = [
  <PanelView key="right-1" index={1} />,
  <PanelView key="right-2" index={2} />,
  <PanelView key="right-3" index={3} />,
  <PanelView key="right-4" index={4} />,
  <PanelView key="right-5" index={5} />,
];

// ============================================================================
// Global header menu nav
// ============================================================================

function MenuNav() {
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
      <div className="flex flex-col gap-1">
        {['Button', 'Button', 'Button', 'Button', 'Button'].map((label, i) => (
          <button
            type="button"
            key={i}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <SquareMenu className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="my-2 border-t border-border-subtle" />

      <div className="flex flex-col gap-1">
        <button
          type="button"
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
                type="button"
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
// Agent configuration form (canvas default content)
// ============================================================================

const inputClass =
  'w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-brand';

function AgentConfigForm() {
  return (
    <StudioGrid cols={12} gap="md" className="space-y-4">
      {/* Page title — no border/background, just text */}
      <StudioGridItem
        cols={12}
        border={false}
        background="transparent"
        padding="none"
        className="pb-2"
      >
        <h1 className="text-2xl font-semibold text-foreground">Agent configuration</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Configure prompts, memory, and context for your agent.
        </p>
      </StudioGridItem>

      {/* Configuration card */}
      <StudioGridItem cols={12}>
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-foreground">Configuration</h4>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="system-prompt"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                System prompt
              </label>
              <textarea
                id="system-prompt"
                rows={4}
                placeholder="Enter the system prompt for the agent..."
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="user-prompt"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                User prompt
              </label>
              <textarea
                id="user-prompt"
                rows={4}
                placeholder="Enter the user prompt..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                Name
              </label>
              <input id="name" type="text" placeholder="Enter a name" className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <input id="email" type="email" placeholder="Enter an email" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tools" className="mb-2 block text-sm font-medium text-foreground">
                Tools
              </label>
              <select id="tools" className={inputClass}>
                <option value="">Choose tools...</option>
                <option value="web-search">Web search</option>
                <option value="file-reader">File reader</option>
                <option value="calculator">Calculator</option>
                <option value="email-sender">Email sender</option>
                <option value="database-query">Database query</option>
                <option value="api-caller">API caller</option>
              </select>
            </div>
          </div>
        </div>
      </StudioGridItem>

      {/* Memory card */}
      <StudioGridItem cols={12}>
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground">Memory</h4>
          <p className="text-sm text-foreground-muted">
            Enables the agent to learn from past execution experiences.
          </p>
          <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs text-foreground-muted">
              Memory settings and configuration options will be displayed here.
            </p>
          </div>
        </div>
      </StudioGridItem>

      {/* Context card */}
      <StudioGridItem cols={12} className="mb-6">
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-foreground">Context</h4>
          <p className="text-sm text-foreground-muted">
            Provide relevant information to help the agent make informed decisions.
          </p>
          <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
            <p className="text-xs text-foreground-muted">
              Context information and configuration options will be displayed here.
            </p>
          </div>
        </div>
      </StudioGridItem>
    </StudioGrid>
  );
}

// ============================================================================
// Dataset form (canvas content for Dataset story)
// ============================================================================

type DataPoint = {
  id: string;
  name: string;
  input: string;
  inputFull: string;
  expectedOutput: string;
  type: 'text' | 'json' | 'image';
  status: 'Active' | 'Draft' | 'Archived';
  created: string;
  notes?: string;
};

const dataPoints: DataPoint[] = [
  {
    id: 'dp-001',
    name: 'dp-001',
    input: 'Summarize the following earnings report...',
    inputFull:
      'Summarize the following earnings report in 3 bullet points: "Q3 revenue reached $4.2B, up 12% year-over-year. Net income margin improved to 18%. Full-year guidance has been raised to $16.5B."',
    expectedOutput:
      '• Revenue up 12% YoY to $4.2B\n• Net income margin at 18%\n• FY guidance raised to $16.5B',
    type: 'text',
    status: 'Active',
    created: 'Jan 15, 2024',
    notes: 'Baseline summarization test case for financial documents.',
  },
  {
    id: 'dp-002',
    name: 'dp-002',
    input: 'Classify this customer inquiry: "My invoice is wrong."',
    inputFull:
      'Classify this customer inquiry into one of: Billing, Technical, General. Inquiry: "My invoice is wrong — it shows a charge I did not authorize."',
    expectedOutput: 'Billing',
    type: 'text',
    status: 'Active',
    created: 'Jan 16, 2024',
    notes: 'Single-label classification example.',
  },
  {
    id: 'dp-003',
    name: 'dp-003',
    input: 'Extract entities from: "Acme Corp signed a deal..."',
    inputFull:
      'Extract named entities (ORG, PERSON, DATE, MONEY) from: "Acme Corp signed a $50M deal with GlobalTech on March 3rd, led by CEO Jane Smith."',
    expectedOutput:
      '{"ORG": ["Acme Corp", "GlobalTech"], "PERSON": ["Jane Smith"], "DATE": ["March 3rd"], "MONEY": ["$50M"]}',
    type: 'json',
    status: 'Active',
    created: 'Jan 17, 2024',
  },
  {
    id: 'dp-004',
    name: 'dp-004',
    input: 'Detect the intent of: "Cancel my subscription."',
    inputFull:
      'Detect the user intent from the following message. Choose from: cancel_subscription, upgrade_plan, get_support, check_status. Message: "I want to cancel my subscription immediately."',
    expectedOutput: 'cancel_subscription',
    type: 'text',
    status: 'Active',
    created: 'Jan 18, 2024',
    notes: 'Intent detection for account management flows.',
  },
  {
    id: 'dp-005',
    name: 'dp-005',
    input: 'Analyze sentiment: "The product is fantastic!"',
    inputFull:
      'Analyze the sentiment of the following product review and return a score from -1.0 (very negative) to 1.0 (very positive). Review: "The product is absolutely fantastic, exceeded all my expectations!"',
    expectedOutput: '0.95',
    type: 'text',
    status: 'Active',
    created: 'Jan 19, 2024',
  },
  {
    id: 'dp-006',
    name: 'dp-006',
    input: 'Translate to French: "Welcome to our platform."',
    inputFull:
      'Translate the following English text to French: "Welcome to our platform. We are happy to have you here."',
    expectedOutput: 'Bienvenue sur notre plateforme. Nous sommes heureux de vous accueillir.',
    type: 'text',
    status: 'Draft',
    created: 'Jan 20, 2024',
    notes: 'Translation quality benchmark — French locale.',
  },
  {
    id: 'dp-007',
    name: 'dp-007',
    input: 'Parse invoice fields from JSON payload...',
    inputFull:
      '{"vendor": "Office Supplies Co.", "date": "2024-01-20", "line_items": [{"desc": "Pens x50", "amount": 25.00}, {"desc": "Paper reams x10", "amount": 45.00}], "total": 70.00}',
    expectedOutput: '{"vendor": "Office Supplies Co.", "total": 70.00, "line_count": 2}',
    type: 'json',
    status: 'Active',
    created: 'Jan 21, 2024',
  },
  {
    id: 'dp-008',
    name: 'dp-008',
    input: 'Categorize email: "Server is down, urgent!"',
    inputFull:
      'Categorize the following email into one of: urgent_incident, feature_request, billing_issue, general_inquiry. Email subject: "Server is down, urgent!" Body: "Our production server has been unreachable for the past 30 minutes."',
    expectedOutput: 'urgent_incident',
    type: 'text',
    status: 'Active',
    created: 'Jan 22, 2024',
    notes: 'High-priority routing test case.',
  },
  {
    id: 'dp-009',
    name: 'dp-009',
    input: 'Triage bug report: null pointer on login page',
    inputFull:
      'Triage the following bug report and assign a severity (P0–P3) and team (Frontend, Backend, Infra). Report: "NullPointerException thrown on /login when email field is empty. Affects all users. Reproducible 100%."',
    expectedOutput: '{"severity": "P1", "team": "Frontend"}',
    type: 'json',
    status: 'Active',
    created: 'Jan 23, 2024',
  },
  {
    id: 'dp-010',
    name: 'dp-010',
    input: 'Check policy compliance for: remote work request',
    inputFull:
      'Check if the following request complies with the remote work policy. Policy: employees must be in-office 3 days per week. Request: "I would like to work fully remote for the next 3 months due to a home renovation."',
    expectedOutput: 'non_compliant',
    type: 'text',
    status: 'Draft',
    created: 'Jan 24, 2024',
    notes: 'Policy compliance classifier — HR domain.',
  },
];

function DatasetForm() {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  const filtered = dataPoints.filter((dp) => {
    const matchesSearch =
      !search ||
      dp.name.toLowerCase().includes(search.toLowerCase()) ||
      dp.input.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || dp.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || dp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every((dp) => selectedRows.has(dp.id));
  const someSelected = filtered.some((dp) => selectedRows.has(dp.id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        filtered.forEach((dp) => next.delete(dp.id));
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        filtered.forEach((dp) => next.add(dp.id));
        return next;
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const statusClass = (status: DataPoint['status']) => {
    if (status === 'Active') return 'bg-success/10 text-success';
    if (status === 'Draft')
      return 'bg-surface-raised text-foreground-muted border border-border-subtle';
    return 'bg-surface-raised text-foreground-subtle border border-border-subtle';
  };

  return (
    <div className="py-2">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search data points..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-foreground-muted">
          {filtered.length} data point{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-border-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 px-2" />
              <TableHead className="w-8 px-2">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-24">Name</TableHead>
              <TableHead>Input</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-12 px-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((dp) => (
              <React.Fragment key={dp.id}>
                <TableRow className={expandedRows.has(dp.id) ? 'bg-surface-raised/40' : undefined}>
                  <TableCell className="h-12 w-8 px-2 py-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(dp.id)}
                      className="flex items-center justify-center text-foreground-muted transition-colors hover:text-foreground"
                      aria-label={expandedRows.has(dp.id) ? 'Collapse row' : 'Expand row'}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-150 ${expandedRows.has(dp.id) ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="h-12 w-8 px-2 py-0">
                    <Checkbox
                      checked={selectedRows.has(dp.id)}
                      onCheckedChange={(v: boolean | 'indeterminate') =>
                        toggleSelect(dp.id, v === true)
                      }
                      aria-label={`Select ${dp.name}`}
                    />
                  </TableCell>
                  <TableCell className="h-12 px-4 py-0 font-medium text-foreground">
                    {dp.name}
                  </TableCell>
                  <TableCell className="h-12 max-w-[200px] truncate px-4 py-0 text-foreground-muted">
                    {dp.input}
                  </TableCell>
                  <TableCell className="h-12 px-4 py-0">
                    <Badge variant="outline" className="text-xs capitalize">
                      {dp.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="h-12 px-4 py-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(dp.status)}`}
                    >
                      {dp.status}
                    </span>
                  </TableCell>
                  <TableCell className="h-12 px-4 py-0 text-sm text-foreground-muted">
                    {dp.created}
                  </TableCell>
                  <TableCell className="h-12 px-2 py-0">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      aria-label="More options"
                    >
                      <EllipsisVertical className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(dp.id) && (
                  <TableRow className="hover:bg-surface-raised/20">
                    <TableCell colSpan={8} className="bg-surface-raised/20 px-10 py-4">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Input
                          </p>
                          <p className="text-foreground">{dp.inputFull}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Expected output
                          </p>
                          <p className="text-foreground">{dp.expectedOutput}</p>
                        </div>
                        {dp.notes && (
                          <div className="col-span-2">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                              Notes
                            </p>
                            <p className="text-foreground-muted">{dp.notes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-foreground-muted">
                  No data points found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================================================
// Canvas right panel — agent configuration form
// ============================================================================

function CanvasAgentPanel() {
  const [model, setModel] = React.useState('');

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">New Agent</h3>
      </div>
      <div className="border-t border-border-subtle" />
      <div className="flex-1 overflow-y-auto space-y-5 px-4 py-4">
        {/* Model */}
        <div>
          <label htmlFor="model" className="mb-1.5 block text-xs font-medium text-foreground">
            Model
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-opus-4-6">Claude Opus 4.6</SelectItem>
              <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System prompt — code block */}
        <div>
          <label
            htmlFor="system-prompt"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            System prompt
          </label>
          <textarea
            id="system-prompt"
            rows={6}
            placeholder="// Enter system prompt..."
            className="w-full resize-none rounded-md border border-border-subtle bg-surface-raised px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* User prompt — text editor */}
        <div>
          <label htmlFor="user-prompt" className="mb-1.5 block text-xs font-medium text-foreground">
            User prompt
          </label>
          <Textarea
            id="user-prompt"
            rows={5}
            placeholder="Enter user prompt..."
            className="resize-none border-border-subtle bg-surface text-foreground placeholder:text-foreground-subtle focus-visible:ring-brand"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Blank: Story = {
  name: 'Blank',
  render: (_, { globals }) => (
    <StudioTemplate
      theme={globals.theme || 'future-dark'}
      menuContent={<MenuNav />}
      leftPanelViews={leftPanelViews}
      rightPanelViews={rightPanelViews}
      defaultLeftPanelCollapsed
      defaultRightPanelCollapsed
    />
  ),
};

export const Panels: Story = {
  name: 'Configuration',
  render: (_, { globals }) => (
    <StudioTemplate
      theme={globals.theme || 'future-dark'}
      menuContent={<MenuNav />}
      leftPanelViews={leftPanelViews}
      rightPanelViews={rightPanelViews}
    >
      <AgentConfigForm />
    </StudioTemplate>
  ),
};

export const CanvasStory: Story = {
  name: 'Canvas',
  render: (_, { globals }) => (
    <StudioTemplate
      theme={globals.theme || 'future-dark'}
      menuContent={<MenuNav />}
      canvasBackground="surface"
      leftPanelViews={leftPanelViews}
      pinLeftPanel
      pinRightPanel
      rightPanelViews={[
        <CanvasAgentPanel key="agent" />,
        <PanelView key="right-2" index={2} />,
        <PanelView key="right-3" index={3} />,
        <PanelView key="right-4" index={4} />,
        <PanelView key="right-5" index={5} />,
      ]}
    />
  ),
};

function DatasetStory({ theme }: { theme: string }) {
  const [activeTab, setActiveTab] = React.useState('data-points');
  return (
    <StudioTemplate
      theme={theme as never}
      menuContent={<MenuNav />}
      canvasBackground="surface"
      canvasFullWidth
      leftPanelViews={leftPanelViews}
      rightPanelViews={rightPanelViews}
      pageHeader={
        <PageHeader
          title="Dataset"
          breadcrumb={['POPoC', 'DefaultTenant', 'Dataset']}
          tabs={[
            { value: 'data-points', label: 'Data points' },
            { value: 'runs', label: 'Runs' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <>
              <Button
                variant="ghost"
                className="text-foreground-accent hover:bg-transparent hover:text-foreground"
              >
                Add
              </Button>
              <Button
                variant="ghost"
                className="text-foreground-accent hover:bg-transparent hover:text-foreground"
              >
                Import
              </Button>
              <Button className="bg-brand text-foreground-on-accent hover:bg-brand/90">Run</Button>
            </>
          }
        />
      }
    >
      <DatasetForm />
    </StudioTemplate>
  );
}

export const Dataset: Story = {
  name: 'Dataset',
  render: (_, { globals }) => <DatasetStory theme={globals.theme || 'future-dark'} />,
};
