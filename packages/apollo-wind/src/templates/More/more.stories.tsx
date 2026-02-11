import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ArrowUp, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';
import { MaestroHeader } from '@/components/custom/global-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Row, Column, Grid } from '@/components/ui/layout';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Onboarding',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared: Coming Soon page
// ============================================================================

function ComingSoonPage({
  title,
  theme,
}: {
  title: string;
  theme: string;
}) {
  return (
    <div
      className={cn(
        theme === 'light' ? 'future-light' : 'future-dark',
        'flex h-screen w-full items-center justify-center bg-future-surface'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-future-foreground">
          {title}
        </h1>
        <p className="text-base text-future-foreground-muted">
          Coming soon
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Agentic Process: Types
// ============================================================================

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  category?: string;
  tools?: string[];
  onUse?: () => void;
}

// ============================================================================
// Agentic Process: Data
// ============================================================================

const defaultTemplates: ProcessTemplate[] = [
  {
    id: '1',
    name: 'Client Onboarding Account Opening',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate customer data across...',
    usageCount: 3400,
    category: 'financial',
    tools: ['office365', 'maestro'],
  },
  {
    id: '2',
    name: 'KYC / CDD & Sanctions Screening',
    description:
      'An agentic process built with Maestro, modeled using BPMN to coordinate identity verification, s...',
    usageCount: 1700,
    category: 'financial',
    tools: ['google', 'maestro'],
  },
  {
    id: '3',
    name: 'Payments Processing & Exceptions',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate payment validation, f...',
    usageCount: 1200,
    category: 'financial',
    tools: ['office365', 'maestro'],
  },
  {
    id: '4',
    name: 'AML Alert Investigation & Case Mgmt',
    description:
      'An agentic process built with Maestro, modeled using BPMN to handle AML alerts through tran...',
    usageCount: 3400,
    category: 'financial',
    tools: ['office365', 'maestro'],
  },
  {
    id: '5',
    name: 'Regulatory Reporting',
    description:
      'An agentic process built with Maestro, modeled using BPMN to automate data aggregation, com...',
    usageCount: 1700,
    category: 'financial',
    tools: ['google', 'maestro'],
  },
  {
    id: '6',
    name: 'Insurance First Notice of Loss (FNOL)',
    description:
      'An agentic process built with Maestro, modeled using BPMN to guide claim intake, coverage che...',
    usageCount: 1200,
    category: 'healthcare',
    tools: ['office365', 'maestro'],
  },
  {
    id: '7',
    name: 'Insurance Claims Adjudication & Settlement',
    description:
      'An agentic process built with Maestro, modeled using BPMN to coordinate policy validation, frau...',
    usageCount: 3400,
    category: 'healthcare',
    tools: ['office365', 'maestro'],
  },
  {
    id: '8',
    name: 'Underwriting (New & Renewal)',
    description:
      'An agentic process built with Maestro, modeled using BPMN to orchestrate data gathering, risk...',
    usageCount: 1700,
    category: 'other',
    tools: ['google', 'maestro'],
  },
  {
    id: '9',
    name: 'Cards Dispute & Chargeback Management',
    description:
      'An agentic process built with Maestro, modeled using BPMN to automate dispute intake, transac...',
    usageCount: 1200,
    category: 'financial',
    tools: ['office365', 'maestro'],
  },
];

const defaultCategories = [
  { id: 'financial', label: 'Financial' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'other', label: 'Other' },
];

const defaultTools = [
  { id: 'office365', label: 'Office365' },
  { id: 'jira', label: 'Jira' },
  { id: 'sap-concur', label: 'SAP Concur' },
  { id: 'slack', label: 'Slack' },
  { id: 'docusign', label: 'DocuSign' },
];

// ============================================================================
// Agentic Process: Component
// ============================================================================

function AgenticProcessPage({ theme }: { theme: string }) {
  const themeValue = theme === 'light' ? 'light' : 'dark';
  const themeClass = theme === 'light' ? 'future-light' : 'future-dark';

  const [autopilotPrompt, setAutopilotPrompt] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]);

  const formatUsageCount = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const toggleTool = (id: string) =>
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const filteredTemplates = React.useMemo(() => {
    return defaultTemplates.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        (t.category && selectedCategories.includes(t.category));
      const matchesTools =
        selectedTools.length === 0 ||
        (t.tools && t.tools.some((tool) => selectedTools.includes(tool)));
      return matchesSearch && matchesCategory && matchesTools;
    });
  }, [searchQuery, selectedCategories, selectedTools]);

  const ExampleCard = ({ template }: { template: ProcessTemplate }) => (
    <Column className="group rounded-2xl border border-future-border bg-future-surface-raised p-8 transition-all hover:border-future-border-hover">
      <Column gap={4} flex={1} className="mb-8">
        <h3 className="text-base font-semibold leading-tight text-future-foreground">
          {template.name}
        </h3>
        <p className="text-sm leading-relaxed text-future-foreground-muted">
          {template.description}
        </p>
        <Row gap={1.5} align="center" className="text-xs text-future-foreground-subtle">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>{formatUsageCount(template.usageCount)}</span>
        </Row>
      </Column>
      <button className="flex h-9 w-full items-center justify-center rounded-xl border border-future-border text-sm font-medium text-future-foreground transition-colors hover:bg-future-surface-hover">
        Use
      </button>
    </Column>
  );

  return (
    <>
      <div
        className={cn(themeClass, 'flex h-screen flex-col bg-future-surface')}
        style={{ fontFamily: fontFamily.base }}
      >
        {/* Global header */}
        <MaestroHeader theme={themeValue} title="Maestro" />

        {/* Page content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-8 py-12 md:px-16 md:py-16">
          {/* Header */}
          <div className="mb-10">
            <Row justify="between" align="start" gap={8}>
              <Column flex={1}>
                <h1 className="text-3xl font-bold tracking-tight text-future-foreground">
                  Let&apos;s create an agentic process
                </h1>
                <p className="mt-4 text-base text-future-foreground-muted">
                  Design and orchestrate end-to-end processes with AI agents, robots, and people
                  using BPMN-based diagrams.
                </p>
              </Column>
              <button
                className="shrink-0 text-sm font-medium text-future-accent-foreground transition-colors hover:text-future-foreground"
                onClick={() => setDrawerOpen(true)}
              >
                Explore templates
              </button>
            </Row>
          </div>

          {/* Autopilot — above cards */}
          <div className="mx-auto mb-12 w-full max-w-3xl">
            <h2 className="mb-6 text-lg font-semibold text-future-foreground">Autopilot</h2>
            <div className="rounded-2xl border border-future-border bg-future-surface-raised">
              <div className="relative p-6">
                <Textarea
                  placeholder="Create an agent to..."
                  value={autopilotPrompt}
                  onChange={(e) => setAutopilotPrompt(e.target.value)}
                  className="min-h-[120px] resize-none border-0 bg-transparent p-0 pb-12 text-sm text-future-foreground placeholder:text-future-foreground-subtle focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                    }
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-future-foreground-muted transition-colors hover:text-future-foreground disabled:opacity-50"
                    disabled={!autopilotPrompt}
                    aria-label="Clear prompt"
                    onClick={() => setAutopilotPrompt('')}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-future-accent text-future-foreground-on-accent disabled:opacity-50"
                    disabled={!autopilotPrompt.trim()}
                    aria-label="Submit prompt"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="border-t border-future-border-subtle px-6 py-3 text-center">
                <p className="text-xs text-future-foreground-subtle">
                  Autopilot can make mistakes. Please double check the responses.
                </p>
              </div>
            </div>
          </div>

          {/* Template cards */}
          <Grid gap={8} cols={1} className="sm:grid-cols-2 lg:grid-cols-4">
            {/* Blank card */}
            <button className="group flex cursor-pointer flex-col items-center justify-between rounded-2xl border border-dashed border-future-border bg-future-surface-raised p-8 text-center transition-all hover:border-future-border-hover">
              <Column gap={4} w="full">
                <h3 className="text-base font-semibold text-future-foreground">
                  Blank agentic process
                </h3>
                <p className="text-sm text-future-foreground-muted">
                  Start building without a template.
                </p>
              </Column>
              <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-future-border">
                <Plus className="h-8 w-8 text-future-accent" />
              </div>
            </button>

            {/* First 3 template cards */}
            {defaultTemplates.slice(0, 3).map((template) => (
              <ExampleCard key={template.id} template={template} />
            ))}
          </Grid>
        </div>
      </div>

      {/* Explore Templates Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className={cn(themeClass, 'max-h-[75vh] bg-future-surface')}>
          <DrawerHeader className="border-b border-future-border-subtle px-4 py-2 md:px-6 md:py-3">
            <Row justify="between" align="start">
              <div>
                <DrawerTitle className="text-base text-future-foreground md:text-lg">
                  Explore templates
                </DrawerTitle>
                <DrawerDescription className="text-xs text-future-foreground-muted md:text-sm">
                  Build, customise and deploy an Agentic Process starting from a template.
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-future-foreground-muted transition-colors hover:text-future-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </DrawerClose>
            </Row>
          </DrawerHeader>

          <Row overflow="hidden" className="h-[calc(75vh-80px)]">
            {/* Sidebar */}
            <div className="hidden w-56 border-r border-future-border-subtle bg-future-surface-raised p-3 md:block">
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-future-foreground-subtle" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 border-future-border bg-future-surface-overlay pl-7 text-xs text-future-foreground placeholder:text-future-foreground-subtle"
                  />
                </div>
              </div>

              <Column gap={3}>
                <div>
                  <Row justify="between" align="center" className="mb-1.5">
                    <h4 className="text-xs font-semibold text-future-foreground">Category</h4>
                    <button
                      className="text-[10px] text-future-foreground-muted hover:text-future-foreground"
                      onClick={() => setSelectedCategories([])}
                    >
                      Clear
                    </button>
                  </Row>
                  <Column gap={1.5}>
                    {defaultCategories.map((cat) => (
                      <Row key={cat.id} gap={2} align="center">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                          className="h-3 w-3 border-future-border"
                        />
                        <Label
                          htmlFor={`cat-${cat.id}`}
                          className="cursor-pointer text-xs font-normal text-future-foreground-muted"
                        >
                          {cat.label}
                        </Label>
                      </Row>
                    ))}
                  </Column>
                </div>

                <div>
                  <Row justify="between" align="center" className="mb-1.5">
                    <h4 className="text-xs font-semibold text-future-foreground">Tool</h4>
                    <button
                      className="text-[10px] text-future-foreground-muted hover:text-future-foreground"
                      onClick={() => setSelectedTools([])}
                    >
                      Clear
                    </button>
                  </Row>
                  <Column gap={1.5}>
                    {defaultTools.map((tool) => (
                      <Row key={tool.id} gap={2} align="center">
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={selectedTools.includes(tool.id)}
                          onCheckedChange={() => toggleTool(tool.id)}
                          className="h-3 w-3 border-future-border"
                        />
                        <Label
                          htmlFor={`tool-${tool.id}`}
                          className="cursor-pointer text-xs font-normal text-future-foreground-muted"
                        >
                          {tool.label}
                        </Label>
                      </Row>
                    ))}
                  </Column>
                </div>
              </Column>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              <Grid gap={3} cols={1} className="sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <ExampleCard key={template.id} template={template} />
                ))}
              </Grid>

              {filteredTemplates.length === 0 && (
                <Row h={32} justify="center" align="center">
                  <p className="text-sm text-future-foreground-muted">No templates found</p>
                </Row>
              )}
            </div>
          </Row>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const GuidedTour: Story = {
  name: 'Guided Tour',
  render: (_, { globals }) => {
    const themeClass = globals.futureTheme === 'light' ? 'future-light' : 'future-dark';
    return (
      <div
        className={cn(themeClass, 'flex h-screen items-center justify-center bg-future-surface')}
        style={{ fontFamily: fontFamily.base }}
      >
        <p className="text-sm text-future-foreground-muted">Coming soon</p>
      </div>
    );
  },
};

export const AgenticProcess: Story = {
  name: 'Agentic Process',
  render: (_, { globals }) => (
    <AgenticProcessPage theme={globals.futureTheme || 'dark'} />
  ),
};

