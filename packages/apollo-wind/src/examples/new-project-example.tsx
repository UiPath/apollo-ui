import { ArrowUp, Plus, Search, X } from 'lucide-react';
import * as React from 'react';
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
import { cn } from '@/lib';
import { Row, Column, Grid } from '@/components/ui/layout';

export interface ProjectExample {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  category?: string;
  tools?: string[];
  onUse?: () => void;
}

export interface NewProjectExampleProps {
  className?: string;
  title?: string;
  subtitle?: string;
  templates?: ProjectExample[];
  categories?: Array<{ id: string; label: string }>;
  tools?: Array<{ id: string; label: string }>;
  autopilot?: {
    placeholder?: string;
    disclaimer?: string;
    onSubmit?: (prompt: string) => void;
  };
  onCreateBlank?: () => void;
}

export function NewProjectExample({
  className,
  title = "Let's create an agentic process",
  subtitle = 'Design and orchestrate end-to-end processes with AI agents, robots, and people using BPMN-based diagrams.',
  templates = [
    {
      id: '1',
      name: 'Invoice processing',
      description:
        'Automate the end-to-end process of capturing, validating, and approving invoices.',
      usageCount: 3400,
      category: 'financial',
      tools: ['office365', 'maestro'],
    },
    {
      id: '2',
      name: 'Loan processing',
      description: 'Optimize the evaluation, approval, and disbursement of loans.',
      usageCount: 1700,
      category: 'financial',
      tools: ['google', 'maestro'],
    },
    {
      id: '3',
      name: 'Supplier onboarding',
      description: 'Coordinate the registration, verification, and integration of new suppliers.',
      usageCount: 1200,
      category: 'other',
      tools: ['office365', 'maestro'],
    },
  ],
  categories = [
    { id: 'financial', label: 'Financial' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'other', label: 'Other' },
  ],
  tools = [
    { id: 'office365', label: 'Office365' },
    { id: 'jira', label: 'Jira' },
    { id: 'sap-concur', label: 'SAP Concur' },
    { id: 'slack', label: 'Slack' },
    { id: 'docusign', label: 'DocuSign' },
  ],
  autopilot,
  onCreateBlank,
}: NewProjectExampleProps) {
  const [autopilotPrompt, setAutopilotPrompt] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]);

  const handleAutopilotSubmit = () => {
    if (autopilot?.onSubmit && autopilotPrompt.trim()) {
      autopilot.onSubmit(autopilotPrompt);
    }
  };

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const filteredExamples = React.useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        (template.category && selectedCategories.includes(template.category));

      const matchesTools =
        selectedTools.length === 0 ||
        (template.tools && template.tools.some((tool) => selectedTools.includes(tool)));

      return matchesSearch && matchesCategory && matchesTools;
    });
  }, [templates, searchQuery, selectedCategories, selectedTools]);

  const ExampleCard = ({ template }: { template: ProjectExample }) => (
    <Column className="group rounded-lg border border-border/30 bg-card p-8 transition-all hover:border-border/60 hover:shadow-sm">
      <Column gap={4} flex={1} className="mb-8">
        <h3 className="text-base font-semibold leading-tight">{template.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
        <Row gap={1.5} align="center" className="text-xs text-muted-foreground">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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
      <Button variant="outline" size="sm" className="h-9 w-full" onClick={template.onUse}>
        Use
      </Button>
    </Column>
  );

  return (
    <>
      <Column
        minH="screen"
        gap={8}
        className={cn('bg-background px-8 py-16 md:px-16 md:py-20', className)}
      >
        {/* Header Section */}
        <div>
          <Row justify="between" align="start" gap={8}>
            <Column flex={1}>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-4 text-base text-muted-foreground">{subtitle}</p>
            </Column>
            <Button variant="link" onClick={() => setDrawerOpen(true)} className="shrink-0">
              Explore templates
            </Button>
          </Row>
        </div>

        {/* Examples Grid */}
        <Grid gap={8} cols={1} className="sm:grid-cols-2 lg:grid-cols-4">
          {/* Blank Example */}
          <button
            className="group flex cursor-pointer flex-col items-center justify-between rounded-lg border border-dashed border-border/40 bg-card p-8 text-center transition-all hover:border-border/70 hover:shadow-sm"
            onClick={onCreateBlank}
          >
            <Column gap={4} w="full">
              <h3 className="text-base font-semibold">Blank agentic process</h3>
              <p className="text-sm text-muted-foreground">Start building without a template.</p>
            </Column>
            <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border/50">
              <Plus className="h-8 w-8 text-primary" />
            </div>
          </button>

          {/* Example Cards */}
          {templates.slice(0, 3).map((template) => (
            <ExampleCard key={template.id} template={template} />
          ))}
        </Grid>

        {/* Autopilot Section */}
        {autopilot && (
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="mb-6 text-lg font-semibold">Autopilot</h2>
            <div className="rounded-lg border border-border/30 bg-card">
              <div className="relative p-6">
                <Textarea
                  placeholder={autopilot.placeholder}
                  value={autopilotPrompt}
                  onChange={(e) => setAutopilotPrompt(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 pb-12 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAutopilotSubmit();
                    }
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setAutopilotPrompt('')}
                    disabled={!autopilotPrompt}
                    aria-label="Clear prompt"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleAutopilotSubmit}
                    disabled={!autopilotPrompt.trim()}
                    aria-label="Submit prompt"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {autopilot.disclaimer && (
                <div className="border-t border-border/20 px-6 py-3 text-center">
                  <p className="text-xs text-muted-foreground">{autopilot.disclaimer}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Column>

      {/* Explore Examples Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader className="border-b px-4 py-2 md:px-6 md:py-3">
            <Row justify="between" align="start">
              <div>
                <DrawerTitle className="text-base md:text-lg">Explore templates</DrawerTitle>
                <DrawerDescription className="text-xs md:text-sm">
                  Build, customise and deploy an Agentic Process starting from a template.
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DrawerClose>
            </Row>
          </DrawerHeader>

          <Row overflow="hidden" className="h-[calc(75vh-80px)]">
            {/* Sidebar */}
            <div className="hidden w-56 border-r bg-muted/20 p-3 md:block">
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              </div>

              <Column gap={3}>
                <div>
                  <Row justify="between" align="center" className="mb-1.5">
                    <h4 className="text-xs font-semibold">Category</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-[10px]"
                      onClick={() => setSelectedCategories([])}
                    >
                      Clear
                    </Button>
                  </Row>
                  <Column gap={1.5}>
                    {categories.map((category) => (
                      <Row key={category.id} gap={2} align="center">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="cursor-pointer text-xs font-normal"
                        >
                          {category.label}
                        </Label>
                      </Row>
                    ))}
                  </Column>
                </div>

                <div>
                  <Row justify="between" align="center" className="mb-1.5">
                    <h4 className="text-xs font-semibold">Tool</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-[10px]"
                      onClick={() => setSelectedTools([])}
                    >
                      Clear
                    </Button>
                  </Row>
                  <Column gap={1.5}>
                    {tools.map((tool) => (
                      <Row key={tool.id} gap={2} align="center">
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={selectedTools.includes(tool.id)}
                          onCheckedChange={() => toggleTool(tool.id)}
                          className="h-3 w-3"
                        />
                        <Label
                          htmlFor={`tool-${tool.id}`}
                          className="cursor-pointer text-xs font-normal"
                        >
                          {tool.label}
                        </Label>
                      </Row>
                    ))}
                  </Column>
                </div>

                <Button variant="link" size="sm" className="h-auto p-0 text-[10px]">
                  Show more
                </Button>
              </Column>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              {/* Mobile Search */}
              <div className="mb-3 md:hidden">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <Grid gap={3} cols={1} className="sm:grid-cols-2 lg:grid-cols-3">
                {filteredExamples.map((template) => (
                  <ExampleCard key={template.id} template={template} />
                ))}
              </Grid>

              {filteredExamples.length === 0 && (
                <Row h={32} justify="center" align="center">
                  <p className="text-sm text-muted-foreground">No templates found</p>
                </Row>
              )}
            </div>
          </Row>
        </DrawerContent>
      </Drawer>
    </>
  );
}
