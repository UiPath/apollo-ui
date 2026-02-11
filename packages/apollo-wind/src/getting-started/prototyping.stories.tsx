import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Introduction/Prototyping',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Theme helpers
// ============================================================================

function resolveThemeClass(value: string) {
  if (value === 'legacy-dark') return 'legacy-dark';
  if (value === 'legacy-light') return 'legacy-light';
  if (value === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// Shared chrome
// ============================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{children}</h2>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50">
      {label && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <button
            onClick={handleCopy}
            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!label && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">
        <code style={{ fontFamily: fontFamily.monospace }}>{children}</code>
      </pre>
    </div>
  );
}

function StepItem({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="mb-2 text-base font-semibold text-foreground">{title}</h4>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Overview
// ============================================================================

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Overview</SectionTitle>
        <SectionDescription>
          Prototyping with AI works best when everyone builds on the same foundation. This stack
          powers the Apollo Wind design system — the same components, tokens, and patterns used in
          production. Starting here means your prototypes aren't throwaway mockups; they're a step
          toward real, shippable code.
        </SectionDescription>
      </div>

      {/* Tech Stack code window */}
      <CodeBlock label="Tech Stack">
        {`UI Framework
  React 19
  Tailwind CSS 4
  TypeScript

Component Library
  shadcn/ui — pre-built components (Button, Input, Select, Accordion, Dialog, Sheet, Tabs, DataTable, and more)
  Radix UI — underlying accessibility primitives
  Lucide React — icon system

Theming
  CSS Custom Properties — semantic design tokens
  Two theme families: Future (Dark / Light) and Legacy (Dark / Light)
  Themes are applied via CSS class scoping — no runtime theme provider needed

Documentation
  Storybook 10 — browse all components, templates, and token references live`}
      </CodeBlock>

      <Divider />

      {/* What's NOT in scope */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">What's not in scope</h3>
        <SectionDescription>
          The following are separate systems and not part of this prototyping workflow:
        </SectionDescription>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li>
            <InlineCode>apollo-react</InlineCode> — Material UI component library
          </li>
          <li>
            <InlineCode>apollo-angular</InlineCode> — Angular Material component library
          </li>
          <li>Web Components (ap-chat, ap-data-grid)</li>
        </ul>
      </div>

      <Divider />

      <InfoCallout>
        Build tools, testing frameworks, and release pipelines run behind the scenes and don't
        affect how you design or prompt AI. You don't need to know them to prototype.
      </InfoCallout>
    </div>
  );
}

// ============================================================================
// Tab: Use Cases
// ============================================================================

function PersonaCard({
  role,
  icon,
  scenario,
  solution,
  outcome,
}: {
  role: string;
  icon: string;
  scenario: string;
  solution: string;
  outcome: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {icon}
        </div>
        <h4 className="text-base font-semibold text-foreground">{role}</h4>
      </div>

      <div className="space-y-4">
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scenario
          </span>
          <p className="text-sm leading-6 text-foreground">{scenario}</p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Solution
          </span>
          <p className="text-sm leading-6 text-muted-foreground">{solution}</p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Outcome
          </span>
          <p className="text-sm leading-6 text-muted-foreground">{outcome}</p>
        </div>
      </div>
    </div>
  );
}

function UseCasesTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use Cases</SectionTitle>
        <SectionDescription>
          Apollo is built for anyone who needs to create product experiences quickly — whether
          you're pitching a customer, validating a design, or building a proof of concept. Here's
          how different roles use the system to turn ideas into working prototypes.
        </SectionDescription>
      </div>

      <div className="space-y-6">
        <PersonaCard
          role="Product Manager"
          icon="📋"
          scenario="A supply chain customer needs to visualize their automation workflows and monitor performance across 50+ processes. They want a dashboard that shows analytics, status, and trends at a glance."
          solution="Start from the Maestro Dashboard template. Use the DataTable component for process listings with sorting and filtering. Add StatsCards for KPIs (throughput, error rate, uptime) and the Tabs component to organize views by Overview, Analytics, and Reports."
          outcome="A fully interactive dashboard prototype you can demo to the customer — built in hours, not weeks. Because it uses the same components as production, the engineering team can adopt it directly."
        />

        <PersonaCard
          role="Designer"
          icon="🎨"
          scenario="A developer is building complex automation workflows and needs to understand how the platform handles scale. They want a Flow demo showing how the system manages 100+ workflow steps with branching logic."
          solution="Start from the Flow template with the Properties Simple panel. Use FlowNode components to populate the canvas, the FlowCanvasToolbar for mode switching, and the FlowPanel for the left navigation rail. Leverage the PropertiesExpanded panel for detailed node configuration."
          outcome="A high-fidelity flow editor prototype that demonstrates scale and interaction patterns. Feed the AI context file to Cursor or Claude and iterate on the layout in real time — every component is already themed and accessible."
        />

        <PersonaCard
          role="Engineer"
          icon="🛠️"
          scenario="A customer needs to consolidate and format complex Excel documents into a presentation-ready format. They want a Delegate-style interface where an AI assistant guides the user through the process step by step."
          solution="Start from the Delegate template with the sidebar navigation panel. Use the ChatComposer and ChatStepsView custom components for the AI assistant interaction. Add FileUpload for document ingestion, and use Card and DataTable components to preview the transformed output."
          outcome="A working prototype that shows the end-to-end user experience — from uploading files to reviewing AI-generated output. The prototype runs in Storybook, so stakeholders can interact with it directly in a browser."
        />
      </div>

      <Divider />

      <InfoCallout>
        These are starting points. Every template and component in Apollo is composable — mix and
        match to fit your specific customer scenario. Browse the Templates section in the Storybook
        sidebar to see what's available.
      </InfoCallout>
    </div>
  );
}

// ============================================================================
// Tab: Use Figma
// ============================================================================

function UseFigmaTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use Figma</SectionTitle>
        <SectionDescription>
          Our design team maintains the Apollo design system in Figma — the single source of truth
          for all design assets, components, and tokens. Access is currently limited to internal
          team members.
        </SectionDescription>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Use AI
// ============================================================================

// The AI context file content rendered as a copyable block
const AI_CONTEXT_PREVIEW = `# Apollo Wind — AI Context

## Stack
- React 19, TypeScript, Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- Lucide React icons, Storybook 10

## Import Paths
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib';

## Theming
Apply theme class to root: future-dark | future-light | legacy-dark | legacy-light
Use semantic tokens: bg-future-surface, text-future-foreground, border-future-border
DO NOT use raw colors (bg-zinc-900, bg-white, etc.)

## Available Components
Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Calendar,
Card, Checkbox, Collapsible, Combobox, Command, ContextMenu, DataTable,
DatePicker, Dialog, Drawer, DropdownMenu, EmptyState, FileUpload, HoverCard,
Input, Label, Menubar, MultiSelect, NavigationMenu, Pagination, Popover,
Progress, RadioGroup, Resizable, ScrollArea, Search, Select, Separator,
Sheet, Skeleton, Slider, Spinner, StatsCard, Stepper, Switch, Table, Tabs,
Textarea, Toggle, ToggleGroup, Tooltip, ViewportGuard`;

function UseAITab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use AI</SectionTitle>
        <SectionDescription>
          Two approaches are available for AI-assisted prototyping. Use one or both depending on
          your workflow — the static context file works everywhere, while the MCP server provides a
          live connection for code editors.
        </SectionDescription>
      </div>

      {/* Approach 1: AI Context File */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Approach 1: AI Context File</h3>
        <SectionDescription>
          A portable markdown file containing the full Apollo design system reference — stack,
          components, tokens, patterns, and rules. Copy it into any AI tool to get consistent,
          design-system-aligned output.
        </SectionDescription>

        <div className="space-y-4">
          <StepItem step={1} title="Grab the context file">
            <p>
              The file lives at <InlineCode>packages/apollo-wind/apollo-ai-context.md</InlineCode>{' '}
              in the repository. It contains everything an AI needs: the stack, every available
              component, token naming conventions, import patterns, and explicit rules about what to
              use and what to avoid.
            </p>
          </StepItem>

          <StepItem step={2} title="Feed it to your AI tool">
            <p>Use it as context in any of these workflows:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">Cursor</span> — Add it as a project
                rule in <InlineCode>.cursor/rules/</InlineCode>
              </li>
              <li>
                <span className="font-medium text-foreground">Claude / ChatGPT</span> — Paste or
                attach the file at the start of your conversation
              </li>
              <li>
                <span className="font-medium text-foreground">Any AI coding tool</span> — Include it
                as system context or a reference file
              </li>
            </ul>
          </StepItem>

          <StepItem step={3} title="Start prompting">
            <p>
              The AI will now use Apollo components and tokens instead of generating generic code.
              Example prompt:
            </p>
            <CodeBlock>
              {`Create a settings page with a sidebar navigation and a form section.
Use a Card for each settings group with Input and Select fields.
Include a header with the MaestroHeader component.
Use the future-dark theme.`}
            </CodeBlock>
          </StepItem>
        </div>
      </div>

      <Divider />

      {/* Preview */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Context file preview</h3>
        <SectionDescription>
          Here's a condensed preview. The full file includes detailed component tables, custom
          component references, and a complete code example.
        </SectionDescription>
        <CodeBlock label="apollo-ai-context.md (preview)">{AI_CONTEXT_PREVIEW}</CodeBlock>
      </div>

      <Divider />

      {/* Approach 2: Storybook MCP */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">
          Approach 2: Storybook MCP Server
        </h3>
        <SectionDescription>
          For code-editor workflows (Cursor, Claude Code, VS Code), the Storybook MCP server gives
          AI agents a live, structured API to query component metadata directly — no copy-pasting
          needed. The agent gets validated props, usage examples, and component documentation
          automatically.
        </SectionDescription>

        <div className="space-y-4">
          <StepItem step={1} title="Start Storybook">
            <CodeBlock>
              {`cd packages/apollo-wind
pnpm storybook`}
            </CodeBlock>
            <p>
              The MCP endpoint is available at <InlineCode>http://localhost:6006/mcp</InlineCode>{' '}
              when Storybook is running.
            </p>
          </StepItem>

          <StepItem step={2} title="Connect your AI tool">
            <p>
              <span className="font-medium text-foreground">Cursor</span> — Add this to your
              project's <InlineCode>.cursor/mcp.json</InlineCode>:
            </p>
            <CodeBlock label=".cursor/mcp.json">
              {`{
  "mcpServers": {
    "apollo-storybook": {
      "url": "http://localhost:6006/mcp"
    }
  }
}`}
            </CodeBlock>

            <p className="mt-3">
              <span className="font-medium text-foreground">Claude Code</span> — Run this command:
            </p>
            <CodeBlock>
              {`claude mcp add apollo-storybook --transport http http://localhost:6006/mcp --scope project`}
            </CodeBlock>
          </StepItem>

          <StepItem step={3} title="Verify the connection">
            <p>
              In Cursor, check the MCP panel in settings. In Claude Code, run{' '}
              <InlineCode>/mcp list</InlineCode> to confirm the server is connected. The AI agent
              will now automatically query Apollo's component APIs when generating UI code.
            </p>
          </StepItem>
        </div>
      </div>

      <Divider />

      <InfoCallout>
        <span className="font-medium text-foreground">Which approach should I use?</span> If you're
        a designer working in ChatGPT or Claude, use the context file (Approach 1). If you're in a
        code editor like Cursor, use both — the MCP server for live component data plus the context
        file for token and theming rules.
      </InfoCallout>
    </div>
  );
}

// ============================================================================
// Tab: Best Practices
// ============================================================================

function BestPracticesTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Best Practices</SectionTitle>
        <SectionDescription>
          Guidelines for getting the most out of AI-assisted prototyping with Apollo.
        </SectionDescription>
      </div>

      {/* Setting up */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Setting Up a Prototype</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Start from an existing template.</span>{' '}
            The Maestro, Admin, Delegate, and Flow templates provide production-ready layouts. Fork
            one instead of building from scratch.
          </li>
          <li>
            <span className="font-medium text-foreground">Always include the AI context.</span>{' '}
            Whether you use the markdown file or MCP, always give the AI context about Apollo before
            prompting. Without it, you'll get generic React output that doesn't match the design
            system.
          </li>
          <li>
            <span className="font-medium text-foreground">Set the theme class first.</span> Apply{' '}
            <InlineCode>future-dark</InlineCode> or <InlineCode>future-light</InlineCode> to your
            root element before adding any content. This ensures all tokens resolve correctly from
            the start.
          </li>
        </ul>
      </div>

      <Divider />

      {/* Prompting */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Writing Effective Prompts</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Be specific about components.</span> Say
            "use a shadcn DataTable with sorting and pagination" instead of "add a table." Name the
            exact components you want.
          </li>
          <li>
            <span className="font-medium text-foreground">Reference tokens, not colors.</span> Say
            "use bg-future-surface-raised for the card background" instead of "make the background
            dark gray." This ensures theme consistency.
          </li>
          <li>
            <span className="font-medium text-foreground">Iterate in small steps.</span> Build the
            layout first, then add interactions, then refine styling. Large prompts with many
            requirements produce worse results than focused, sequential ones.
          </li>
          <li>
            <span className="font-medium text-foreground">Include layout context.</span> Mention
            "fullscreen layout", "sidebar + main content", or "tabbed interface" so the AI
            structures the page correctly from the start.
          </li>
        </ul>
      </div>

      <Divider />

      {/* Common mistakes */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Common Mistakes to Avoid</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Don't use raw Tailwind colors.</span>{' '}
            Avoid <InlineCode>bg-zinc-900</InlineCode>, <InlineCode>text-gray-400</InlineCode>, etc.
            Always use semantic tokens (<InlineCode>bg-future-surface</InlineCode>,{' '}
            <InlineCode>text-future-foreground-muted</InlineCode>).
          </li>
          <li>
            <span className="font-medium text-foreground">Don't install extra UI libraries.</span>{' '}
            Everything you need is already available in apollo-wind. Adding Material UI, Chakra, or
            other libraries will conflict with the design system.
          </li>
          <li>
            <span className="font-medium text-foreground">Don't skip the theme wrapper.</span>{' '}
            Components using <InlineCode>future-*</InlineCode> tokens won't render correctly without
            a theme class on a parent element.
          </li>
          <li>
            <span className="font-medium text-foreground">Don't hardcode light/dark values.</span>{' '}
            The theme system handles this automatically. If you're writing{' '}
            <InlineCode>bg-white</InlineCode> or <InlineCode>bg-black</InlineCode>, you're bypassing
            the design system.
          </li>
        </ul>
      </div>

      <Divider />

      {/* Review checklist */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Prototype Review Checklist</h3>
        <SectionDescription>Before sharing a prototype, verify these items:</SectionDescription>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Theme class applied to root element
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            All colors use semantic tokens (no raw hex or Tailwind palette)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Components imported from <InlineCode>@/components/ui/</InlineCode>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Icons from <InlineCode>lucide-react</InlineCode> only
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Works in both Future Dark and Future Light themes
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Uses Inter font family via <InlineCode>fontFamily.base</InlineCode>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">&#9744;</span>
            Responsive layout tested at common breakpoints
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Prototyping Page
// ============================================================================

const tabs = ['Overview', 'Use Cases', 'Use Figma', 'Use AI', 'Best Practices'] as const;
type TabId = (typeof tabs)[number];

function PrototypingPage({ globalTheme }: { globalTheme: string }) {
  const [activeTab, setActiveTab] = React.useState<TabId>('Overview');

  const activeThemeClass = resolveThemeClass(globalTheme);

  return (
    <div
      className={cn(activeThemeClass, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        {/* Header */}
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">
          Prototyping with Apollo
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Rapid prototyping is central to our approach, enabling high-quality UX, consistency, and
          efficiency. This section explores how Design and AI work together to help teams align and
          deliver consistent outcomes.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pt-4 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                'cursor-pointer px-4 pb-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Use Cases' && <UseCasesTab />}
          {activeTab === 'Use Figma' && <UseFigmaTab />}
          {activeTab === 'Use AI' && <UseAITab />}
          {activeTab === 'Best Practices' && <BestPracticesTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Default: Story = {
  render: (_, { globals }) => <PrototypingPage globalTheme={globals.futureTheme || 'dark'} />,
};
