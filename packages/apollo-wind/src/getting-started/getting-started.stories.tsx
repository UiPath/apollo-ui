import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

const meta = {
  title: 'Introduction/Getting Started',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function resolveThemeClass(value: string) {
  return value ?? 'future-dark';
}

// ============================================================================
// Shared components
// ============================================================================

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
            type="button"
            onClick={handleCopy}
            className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      {!label && (
        <button
          type="button"
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
    <div className="space-y-6">
      <SectionDescription>
        Apollo Wind is the Tailwind CSS component library for new React applications. Built on
        shadcn/ui and Radix primitives, it provides 60+ components, page templates, and full theming
        support, all consistent with the Apollo design system tokens from apollo-core.
      </SectionDescription>

      <Divider />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">What's included</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Components',
              description:
                '60+ production-ready components across Forms, Navigation, Overlays, Data Display, and Layout categories.',
              examples: ['Button', 'DataTable', 'Dialog', 'Combobox', 'Tabs'],
            },
            {
              title: 'Templates',
              description:
                'Full page layouts for common UiPath product patterns: admin pages, delegate views, Studio, Flow, and Maestro.',
              examples: ['Admin', 'Delegate', 'Studio', 'Flow', 'Maestro'],
            },
            {
              title: 'Theming',
              description:
                'Future design language themes with full dark and light mode support. All tokens resolve from CSS custom properties.',
              examples: ['future-dark', 'future-light', 'vertex', 'canvas'],
            },
            {
              title: 'Design Tokens',
              description:
                'Semantic color, spacing, typography, and radius tokens from apollo-core, wired into Tailwind via CSS variables.',
              examples: ['Colors', 'Spacing', 'Typography', 'Radius'],
            },
          ].map(({ title, description, examples }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-1 text-base font-semibold text-foreground">{title}</h4>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="flex flex-wrap gap-1.5">
                {examples.map((e) => (
                  <InlineCode key={e}>{e}</InlineCode>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Design principles</h3>
        <div className="space-y-3">
          {[
            {
              title: 'You own the code',
              body: 'Components follow the shadcn ownership model. Source is copied into your project. You can read, modify, and update on your own terms.',
            },
            {
              title: 'Tailwind-first',
              body: 'Styling uses static Tailwind utility classes. No runtime CSS-in-JS or emotion. Works with Tailwind v4 and the @import "tailwindcss" syntax.',
            },
            {
              title: 'Accessible by default',
              body: 'All interactive components are built on Radix UI primitives, which handle focus management, keyboard navigation, and ARIA attributes.',
            },
            {
              title: 'Token-driven theming',
              body: 'Visual appearance is controlled entirely by CSS custom properties from apollo-core. Switching themes is a single class change on the root element.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Quick Start
// ============================================================================

const quickStartPaths = ['Add to existing project', 'Run locally'] as const;
type QuickStartPath = (typeof quickStartPaths)[number];

function QuickStartTab() {
  const [path, setPath] = React.useState<QuickStartPath>('Add to existing project');

  return (
    <div className="space-y-8">
      {/* Path switcher */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-1 text-sm font-semibold text-foreground">What are you trying to do?</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose the path that matches your goal. The steps below will update accordingly.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {quickStartPaths.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPath(p)}
              className={cn(
                'flex-1 cursor-pointer rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                path === p
                  ? 'border-primary bg-primary/10 font-medium text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="block font-medium text-foreground">{p}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {p === 'Add to existing project'
                  ? 'Install Apollo Wind as a dependency in your own app'
                  : 'Clone the apollo-ui repo and run Storybook locally'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {path === 'Add to existing project' && (
        <>
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">Prerequisites</p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium text-foreground">Node 18+</span>: required by the
                shadcn CLI
              </li>
              <li>
                <span className="font-medium text-foreground">Tailwind CSS v4</span>: uses{' '}
                <InlineCode>@import "tailwindcss"</InlineCode>, not{' '}
                <InlineCode>tailwind.config.js</InlineCode>
              </li>
              <li>
                <span className="font-medium text-foreground">React project</span>: Vite, Next.js,
                or any React setup
              </li>
            </ul>
          </InfoCallout>

          <div className="space-y-6">
            <StepItem step={1} title="Install the package">
              <CodeBlock label="terminal">{'npm install @uipath/apollo-wind'}</CodeBlock>
            </StepItem>

            <StepItem step={2} title="Import the CSS theme">
              <CodeBlock label="main.tsx or _app.tsx">
                {`import '@uipath/apollo-wind/tailwind.css';`}
              </CodeBlock>
              <p>This loads Apollo design tokens and the Tailwind base styles.</p>
            </StepItem>

            <StepItem step={3} title="Apply the theme class">
              <CodeBlock label="App.tsx">
                {`export function App() {
  return (
    <div className="future-dark min-h-screen bg-background text-foreground">
      {/* your app */}
    </div>
  );
}`}
              </CodeBlock>
              <p>
                Switch to light mode by replacing <InlineCode>future-dark</InlineCode> with{' '}
                <InlineCode>future-light</InlineCode>. All tokens adapt automatically.
              </p>
            </StepItem>

            <StepItem step={4} title="Add your first component">
              <CodeBlock label="terminal">
                {'npx shadcn@latest add https://ui.uipath.com/r/button.json'}
              </CodeBlock>
              <p>
                Copies the component source into{' '}
                <InlineCode>src/components/ui/button.tsx</InlineCode>. It's yours to use and modify.
              </p>
            </StepItem>
          </div>

          <Divider />

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Import paths</h3>
            <SectionDescription>
              Components and utilities are exported from the package root.
            </SectionDescription>
            <div className="space-y-3">
              <CodeBlock label="Components">
                {`import { Button, Input, Dialog } from '@uipath/apollo-wind';`}
              </CodeBlock>
              <CodeBlock label="Utilities">{`import { cn } from '@uipath/apollo-wind';`}</CodeBlock>
              <CodeBlock label="CSS theme">
                {`import '@uipath/apollo-wind/tailwind.css';`}
              </CodeBlock>
            </div>
          </div>
        </>
      )}

      {path === 'Run locally' && (
        <>
          <InfoCallout>
            <p className="mb-1 font-medium text-foreground">Before you begin</p>
            <p>
              This path is for contributors and team members who want to browse or modify Apollo
              Wind source files and run Storybook on their machine.
            </p>
          </InfoCallout>

          <div className="space-y-6">
            <StepItem step={1} title="Clone the repository">
              <CodeBlock label="terminal">
                {'git clone https://github.com/UiPath/apollo-ui.git\ncd apollo-ui'}
              </CodeBlock>
            </StepItem>

            <StepItem step={2} title="Install dependencies">
              <CodeBlock label="terminal">{'npm install -g pnpm\npnpm install'}</CodeBlock>
              <p>
                This project uses <InlineCode>pnpm</InlineCode> workspaces. Install it globally if
                you don't have it yet.
              </p>
            </StepItem>

            <StepItem step={3} title="Build all packages">
              <CodeBlock label="terminal">{'pnpm build'}</CodeBlock>
              <p>Compiles apollo-core, apollo-wind, and apollo-react before Storybook starts.</p>
            </StepItem>

            <StepItem step={4} title="Start Storybook">
              <CodeBlock label="terminal">{'pnpm storybook:dev'}</CodeBlock>
              <p>
                Opens Apollo Wind Storybook at <InlineCode>http://localhost:6007</InlineCode>.
                Changes to source files hot-reload automatically.
              </p>
            </StepItem>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Tab: Components
// ============================================================================

const components = [
  { category: 'Forms', name: 'Button', description: 'Primary action trigger' },
  { category: 'Forms', name: 'ButtonGroup', description: 'Grouped action buttons' },
  { category: 'Forms', name: 'Input', description: 'Text input field' },
  { category: 'Forms', name: 'Textarea', description: 'Multi-line text input' },
  { category: 'Forms', name: 'Select', description: 'Dropdown selector' },
  { category: 'Forms', name: 'Combobox', description: 'Searchable dropdown' },
  { category: 'Forms', name: 'MultiSelect', description: 'Multi-value selector' },
  { category: 'Forms', name: 'Checkbox', description: 'Boolean toggle' },
  { category: 'Forms', name: 'RadioGroup', description: 'Single-choice selector' },
  { category: 'Forms', name: 'Switch', description: 'On/off toggle' },
  { category: 'Forms', name: 'Slider', description: 'Range input' },
  { category: 'Forms', name: 'Label', description: 'Form field label' },
  { category: 'Forms', name: 'Search', description: 'Search input with clear action' },
  {
    category: 'Forms',
    name: 'FileUpload',
    description: 'Drag-and-drop file input with per-file errors',
  },
  { category: 'Forms', name: 'Stepper', description: 'Multi-step form progress' },
  { category: 'Date & Time', name: 'Calendar', description: 'Month calendar picker' },
  { category: 'Date & Time', name: 'DatePicker', description: 'Date input with popover' },
  { category: 'Date & Time', name: 'DatetimePicker', description: 'Combined date and time picker' },
  { category: 'Layout', name: 'Card', description: 'Content container with header and body' },
  { category: 'Layout', name: 'Separator', description: 'Horizontal or vertical divider' },
  { category: 'Layout', name: 'Resizable', description: 'Draggable split-pane layout' },
  { category: 'Layout', name: 'ScrollArea', description: 'Custom scrollable container' },
  { category: 'Layout', name: 'AspectRatio', description: 'Enforce element aspect ratio' },
  { category: 'Navigation', name: 'Tabs', description: 'Tabbed content switcher' },
  { category: 'Navigation', name: 'Breadcrumb', description: 'Hierarchical location trail' },
  { category: 'Navigation', name: 'Pagination', description: 'Page navigation controls' },
  { category: 'Navigation', name: 'Accordion', description: 'Collapsible content sections' },
  { category: 'Navigation', name: 'TreeView', description: 'Hierarchical item tree' },
  { category: 'Overlays', name: 'Dialog', description: 'Modal overlay' },
  { category: 'Overlays', name: 'Sheet', description: 'Slide-in side panel' },
  { category: 'Overlays', name: 'AlertDialog', description: 'Confirmation dialog' },
  { category: 'Overlays', name: 'Popover', description: 'Anchored floating panel' },
  { category: 'Overlays', name: 'HoverCard', description: 'Preview card on hover' },
  { category: 'Overlays', name: 'DropdownMenu', description: 'Contextual action menu' },
  { category: 'Overlays', name: 'ContextMenu', description: 'Right-click menu' },
  { category: 'Overlays', name: 'Command', description: 'Command palette with search' },
  { category: 'Overlays', name: 'Tooltip', description: 'Inline hover hint' },
  { category: 'Data Display', name: 'DataTable', description: 'Sortable, filterable table' },
  { category: 'Data Display', name: 'Badge', description: 'Status and label pill' },
  { category: 'Data Display', name: 'Alert', description: 'Inline status message' },
  { category: 'Data Display', name: 'StatsCard', description: 'KPI metric card' },
  { category: 'Data Display', name: 'EmptyState', description: 'Zero-state placeholder' },
  { category: 'Data Display', name: 'Skeleton', description: 'Loading placeholder' },
  { category: 'Data Display', name: 'Progress', description: 'Progress bar' },
  { category: 'Data Display', name: 'Spinner', description: 'Loading indicator' },
  { category: 'Data Display', name: 'Sonner', description: 'Toast notifications' },
  { category: 'Data Display', name: 'Toggle', description: 'Single toggle button' },
  { category: 'Data Display', name: 'ToggleGroup', description: 'Segmented toggle controls' },
  { category: 'Custom Apollo', name: 'PageHeader', description: 'Page title and action bar' },
  { category: 'Custom Apollo', name: 'GlobalHeader', description: 'App-level top navigation' },
  { category: 'Custom Apollo', name: 'PanelStudio', description: 'Studio-style side panel' },
  { category: 'Custom Apollo', name: 'PanelDelegate', description: 'Delegate-style nav panel' },
  { category: 'Custom Apollo', name: 'PanelFlow', description: 'Flow editor nav rail' },
  { category: 'Custom Apollo', name: 'PanelMaestro', description: 'Maestro dashboard panel' },
  { category: 'Custom Apollo', name: 'ToolbarCanvas', description: 'Canvas floating toolbar' },
  { category: 'Custom Apollo', name: 'ToolbarView', description: 'View mode toolbar' },
  { category: 'Custom Apollo', name: 'FlowNode', description: 'Workflow canvas node' },
  { category: 'Custom Apollo', name: 'FlowProperties', description: 'Node properties panel' },
  { category: 'Custom Apollo', name: 'GridMaestro', description: 'Maestro-style data grid' },
  {
    category: 'Custom Apollo',
    name: 'ChatComposer',
    description: 'AI chat input with attachments',
  },
  { category: 'Custom Apollo', name: 'ChatStepsView', description: 'AI thinking steps display' },
  {
    category: 'Custom Apollo',
    name: 'ChatFirstExperience',
    description: 'Empty chat onboarding state',
  },
  {
    category: 'Custom Apollo',
    name: 'ChatPromptSuggestions',
    description: 'Suggested prompt chips',
  },
  { category: 'Custom Apollo', name: 'Canvas', description: 'Pannable, zoomable canvas area' },
] as const;

function ComponentsTab() {
  const categories = [...new Set(components.map((c) => c.category))];

  return (
    <div className="space-y-8">
      <SectionDescription>
        All Apollo Wind components organised by category. Open any sidebar story for live examples
        and full prop documentation.
      </SectionDescription>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Component
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <React.Fragment key={category}>
                <tr className="border-b border-border bg-muted/30">
                  <td
                    colSpan={2}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {category}
                  </td>
                </tr>
                {components
                  .filter((c) => c.category === category)
                  .map(({ name, description }) => (
                    <tr
                      key={name}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <InlineCode>{name}</InlineCode>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{description}</td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

const tabs = ['Overview', 'Quick Start', 'Components'] as const;
type TabId = (typeof tabs)[number];

function GettingStartedPage({ globalTheme }: { globalTheme: string }) {
  const [activeTab, setActiveTab] = React.useState<TabId>('Overview');

  return (
    <div
      className={cn(
        resolveThemeClass(globalTheme),
        'min-h-screen w-full bg-background text-foreground'
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-3xl space-y-2 p-8">
        {/* Header */}
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground">Apollo Wind</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Tailwind CSS components for new React applications. Built on shadcn/ui and Radix
          primitives, themed with Apollo design tokens.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0 pt-6">
          {tabs.map((tab) => (
            <button
              type="button"
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
          {activeTab === 'Quick Start' && <QuickStartTab />}
          {activeTab === 'Components' && <ComponentsTab />}
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: (_, { globals }) => <GettingStartedPage globalTheme={globals.theme || 'future-dark'} />,
};
