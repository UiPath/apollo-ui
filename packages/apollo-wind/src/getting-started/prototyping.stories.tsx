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
  if (value === 'core-dark') return 'core-dark';
  if (value === 'core-light') return 'core-light';
  if (value === 'wireframe') return 'wireframe';
  if (value === 'vertex') return 'vertex';
  if (value === 'canvas') return 'canvas';
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

const AI_CONTEXT_PREVIEW = `# Apollo Wind — AI Context

## Stack
- React 19, TypeScript, Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- Lucide React icons, Storybook 10

## Import Paths
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib';

## Theming
Apply theme class to root: future-dark | future-light | core-dark | core-light
Semantic tokens: bg-surface, text-foreground, border-border
Bridge tokens (cross-theme): bg-background, bg-card, text-foreground, text-muted-foreground

## Components (with inline usage examples)
Button, Card, Table, DataTable, Badge, Input, Select, Tabs, Dialog, Sheet...
60+ shadcn components + 16 custom Apollo components + forms system

## Page Templates
MaestroTemplate — dashboard with panels & grid
AdminTemplate — sidebar, header, toolbar & data tables
FlowTemplate — workflow editor with canvas
DelegateTemplate — agent chat with nav panel

## Common Patterns
Card grids, section headers, sidebar layouts, stats rows...

## Rules
DO use semantic tokens, shadcn components, lucide-react icons
DO NOT use raw colors, bg-black/bg-white, or external UI libraries`;

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
  Two theme families: Future (Dark / Light) and Core (Dark / Light)
  Themes are applied via CSS class scoping — no runtime theme provider needed

Documentation
  Storybook 10 — browse all components, templates, and token references live`}
      </CodeBlock>

      <Divider />

      {/* Quick Start */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Quick Start</h3>
        <SectionDescription>
          The fastest path to a working prototype. Choose your tool:
        </SectionDescription>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Cursor</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Type <InlineCode>@apollo-ai-context.md</InlineCode> in chat and describe what you
              want to build. That's it.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Claude Code</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Reference the context file and describe what you want:
            </p>
            <CodeBlock>
              {`Read packages/apollo-wind/apollo-ai-context.md then build a settings page
with a sidebar navigation and form section. Use the future-dark theme.`}
            </CodeBlock>
          </div>
        </div>
      </div>

      <Divider />

      {/* AI Context File */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">The AI Context File</h3>
        <SectionDescription>
          A portable markdown file at{' '}
          <InlineCode>packages/apollo-wind/apollo-ai-context.md</InlineCode> containing the full
          Apollo design system reference — stack, components, tokens, patterns, and rules. Both the
          Use Claude and Use Cursor tabs reference this file.
        </SectionDescription>
        <CodeBlock label="apollo-ai-context.md (preview)">{AI_CONTEXT_PREVIEW}</CodeBlock>
      </div>

      <Divider />

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
    </div>
  );
}

// ============================================================================
// Tab: Use Playground
// ============================================================================

function UsePlaygroundTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use Playground</SectionTitle>
        <SectionDescription>
          This playground enables UiPath team members to quickly set up a prototype app in just a few
          clicks. Its purpose is to help less technical users launch a functional prototype using our
          design system's default styles and templates.
        </SectionDescription>
      </div>

      {/* How to use */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">How to use</h3>
        <SectionDescription>
          Get the playground running locally in three commands, then create prototypes from the UI.
        </SectionDescription>

        <InfoCallout>
          Repository:{' '}
          <a
            href="https://github.com/UiPath/apollo-prototype-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline"
          >
            github.com/UiPath/apollo-prototype-playground
          </a>
        </InfoCallout>
      </div>

      <div className="space-y-4">
        <StepItem step={1} title="Clone the repository">
          <CodeBlock>
            {`git clone https://github.com/UiPath/apollo-prototype-playground.git
cd apollo-prototype-playground`}
          </CodeBlock>
        </StepItem>

        <StepItem step={2} title="Install dependencies">
          <CodeBlock>{`npm install`}</CodeBlock>
        </StepItem>

        <StepItem step={3} title="Start the dev server">
          <CodeBlock>{`npm run dev`}</CodeBlock>
        </StepItem>

        <StepItem step={4} title="Create a prototype">
          <ul className="space-y-2">
            <li>
              Click the <span className="font-medium text-foreground">Create Prototype</span> button
            </li>
            <li>Enter a name for your prototype</li>
            <li>
              Choose a starter template (<span className="font-medium text-foreground">Blank</span>,{' '}
              <span className="font-medium text-foreground">Admin</span>,{' '}
              <span className="font-medium text-foreground">Delegate</span>,{' '}
              <span className="font-medium text-foreground">Flow</span>, or{' '}
              <span className="font-medium text-foreground">Maestro</span>)
            </li>
            <li>Select your folder from the team member list</li>
            <li>
              Optionally toggle{' '}
              <span className="font-medium text-foreground">Shareable URL</span> to generate a link
            </li>
            <li>
              Click <span className="font-medium text-foreground">Create</span> — your prototype
              opens automatically
            </li>
          </ul>
        </StepItem>

        <StepItem step={5} title="Customize your prototype">
          <p>
            Your prototype is scaffolded at{' '}
            <InlineCode>
              src/prototypes/&#123;your-folder&#125;/&#123;prototype-name&#125;/index.tsx
            </InlineCode>{' '}
            using the design system's default styles and templates. From here you can:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <span className="font-medium text-foreground">Modify the layout</span> — rearrange or
              replace sections from the starter template
            </li>
            <li>
              <span className="font-medium text-foreground">Add components</span> — import any
              component from <InlineCode>@uipath/apollo-wind</InlineCode>
            </li>
            <li>
              <span className="font-medium text-foreground">Use AI tools</span> — open the file in
              your editor and use Claude, Copilot, or any AI assistant to iterate on the design
            </li>
            <li>
              <span className="font-medium text-foreground">Hot reload</span> — changes appear
              instantly in the browser via Vite's dev server
            </li>
          </ul>
        </StepItem>
      </div>

      <Divider />

      <InfoCallout>
        The starter templates give you a working foundation with proper theming, responsive layout,
        and UiPath design system components already wired up. No configuration needed — just pick a
        template and start building.
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
          Designers own the Figma source files — AI tools turn those designs into functional code
          prototypes. Connect the Figma MCP server so the AI can read your designs directly.
        </SectionDescription>
      </div>

      <div className="space-y-4">
        <StepItem step={1} title="Start from the Apollo Figma library">
          <p>
            Use the shared design system file as your starting point.
          </p>
          <div className="mt-3 space-y-2 text-sm leading-6">
            <div>
              <span className="font-medium text-foreground">Core products: </span>
              <a
                href="https://www.figma.com/design/l1I5dUQFDxqPYo322wEpXx/Apollo--Components-?node-id=504-2&p=f&t=O0aRtoGuv83eV7od-0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Figma System
              </a>
            </div>
            <div>
              <span className="font-medium text-foreground">Future products: </span>
              <a
                href="https://www.figma.com/design/b6UcBsDS2GUEk5Xdxk4OEl/Style-template?node-id=847-5153&p=f&t=O0aRtoGuv83eV7od-0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Figma System
              </a>
            </div>
          </div>
        </StepItem>

        <StepItem step={2} title="Connect the Figma MCP server">
          <p>This lets the AI read your Figma files directly — no screenshots or exports needed.</p>

          <div className="mt-3 space-y-3">
            <div>
              <span className="font-medium text-foreground">Cursor</span> — Add to{' '}
              <InlineCode>.cursor/mcp.json</InlineCode>:
            </div>
            <CodeBlock>
              {`{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_KEY"]
    }
  }
}`}
            </CodeBlock>

            <div>
              <span className="font-medium text-foreground">Claude Code</span> — Run:
            </div>
            <CodeBlock>
              {`claude mcp add figma -- npx -y figma-developer-mcp --figma-api-key=YOUR_KEY`}
            </CodeBlock>
          </div>
        </StepItem>

        <StepItem step={3} title="Copy the Figma URL and prompt">
          <p>
            Copy the URL for the specific frame you want to prototype. Include context the AI
            can't see: interactions, states, theme, and which Apollo components map to the design.
          </p>
        </StepItem>
      </div>

      <div className="mt-6">
        <CodeBlock label="Example prompt">
          {`Here is my Figma frame for a workflow editor: [paste Figma URL]

Build a functional prototype using the Apollo design system in future-dark theme.
The layout should have a left navigation rail, a canvas area with workflow
nodes, and a properties panel on the right.

Interactions:
- Clicking a node expands the properties panel
- The navigation rail has icons for different tool modes
- Bottom toolbar includes zoom controls

Use the Apollo AI context file for component and token references.`}
        </CodeBlock>
      </div>

      <Divider />

      <InfoCallout>
        See the <span className="font-medium text-foreground">Use Claude</span> or{' '}
        <span className="font-medium text-foreground">Use Cursor</span> tabs for full tool
        setup including the Storybook MCP server and AI context file.
      </InfoCallout>
    </div>
  );
}

// ============================================================================
// Tab: Use Claude
// ============================================================================

function UseClaudeTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use Claude Code</SectionTitle>
        <SectionDescription>
          Complete setup for prototyping with Claude Code. Three things to connect: the AI context
          file, the Storybook MCP server, and optionally the Figma MCP server.
        </SectionDescription>
      </div>

      {/* 1. AI Context */}
      <div className="space-y-4">
        <StepItem step={1} title="Reference the AI context file">
          <p>
            Claude Code can read project files directly. Reference the context file in your
            prompt so Claude knows the design system:
          </p>
          <CodeBlock>
            {`Read packages/apollo-wind/apollo-ai-context.md then create a dashboard page
with a sidebar, header, and a DataTable showing process status.
Use the future-dark theme.`}
          </CodeBlock>
          <p>
            For repeated use, add a note to your project's{' '}
            <InlineCode>CLAUDE.md</InlineCode> so Claude always knows where to find it:
          </p>
          <CodeBlock label="CLAUDE.md addition">
            {`## Prototyping
For UI prototyping, read packages/apollo-wind/apollo-ai-context.md
for the full component library, tokens, and theming reference.`}
          </CodeBlock>
        </StepItem>

        {/* 2. Storybook MCP */}
        <StepItem step={2} title="Connect the Storybook MCP server">
          <p>
            Gives Claude live access to component metadata, props, and usage examples.
          </p>
          <CodeBlock label="Start Storybook first">
            {`cd packages/apollo-wind && pnpm storybook`}
          </CodeBlock>
          <CodeBlock label="Then add the MCP server">
            {`claude mcp add apollo-storybook --transport http http://localhost:6006/mcp --scope project`}
          </CodeBlock>
          <p>
            Verify with <InlineCode>/mcp list</InlineCode> — you should see{' '}
            <InlineCode>apollo-storybook</InlineCode> in the output.
          </p>
        </StepItem>

        {/* 3. Figma MCP */}
        <StepItem step={3} title="Connect Figma">
          <p>
            Add the Figma MCP so Claude can read your design files directly:
          </p>
          <CodeBlock>
            {`claude mcp add figma -- npx -y figma-developer-mcp --figma-api-key=YOUR_KEY`}
          </CodeBlock>
        </StepItem>
      </div>

      <Divider />

      {/* Tips */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Tips for Claude Code</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Use the slash command.</span> Run{' '}
            <InlineCode>/mcp list</InlineCode> to verify all MCP servers are connected before
            prompting.
          </li>
          <li>
            <span className="font-medium text-foreground">Let Claude read the file.</span> Say
            "read apollo-ai-context.md" rather than pasting it — Claude Code can access files
            directly and this keeps your prompt clean.
          </li>
          <li>
            <span className="font-medium text-foreground">Iterate in conversation.</span> Claude
            Code keeps full context, so you can refine incrementally: "now add a filter bar to
            the table" or "switch the theme to future-light."
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Use Cursor
// ============================================================================

function UseCursorTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Use Cursor</SectionTitle>
        <SectionDescription>
          Complete setup for prototyping with Cursor. Three things to connect: the AI context
          file, the Storybook MCP server, and optionally the Figma MCP server.
        </SectionDescription>
      </div>

      {/* 1. AI Context */}
      <div className="space-y-4">
        <StepItem step={1} title="Reference the AI context file">
          <p>
            The fastest way — type <InlineCode>@apollo-ai-context.md</InlineCode> in any Cursor
            chat to attach the design system reference. The AI immediately knows all components,
            tokens, and rules.
          </p>
          <p>
            For automatic inclusion on every chat, add it as a Cursor rule:
          </p>
          <CodeBlock label=".cursor/rules/apollo-prototyping.md">
            {`---
description: Apollo design system context for prototyping
globs: ["packages/apollo-wind/**"]
---
@packages/apollo-wind/apollo-ai-context.md`}
          </CodeBlock>
        </StepItem>

        {/* 2. Storybook MCP */}
        <StepItem step={2} title="Connect the Storybook MCP server">
          <p>
            Gives the agent live access to component metadata, props, and usage examples.
          </p>
          <CodeBlock label="Start Storybook first">
            {`cd packages/apollo-wind && pnpm storybook`}
          </CodeBlock>
          <p>
            Then add this to your project's MCP config:
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
          <p>
            Verify in Cursor Settings → MCP — you should see{' '}
            <InlineCode>apollo-storybook</InlineCode> with a green status.
          </p>
        </StepItem>

        {/* 3. Figma MCP */}
        <StepItem step={3} title="Connect Figma">
          <p>
            Add the Figma MCP server:
          </p>
          <CodeBlock label=".cursor/mcp.json">
            {`{
  "mcpServers": {
    "apollo-storybook": {
      "url": "http://localhost:6006/mcp"
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_KEY"]
    }
  }
}`}
          </CodeBlock>
        </StepItem>
      </div>

      <Divider />

      {/* Tips */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Tips for Cursor</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Use @ referencing.</span> Type{' '}
            <InlineCode>@</InlineCode> to attach files, folders, or docs directly in chat. Use{' '}
            <InlineCode>@apollo-ai-context.md</InlineCode> for the design system context.
          </li>
          <li>
            <span className="font-medium text-foreground">Agent mode for multi-step work.</span>{' '}
            Use Agent mode when building a full page — it can create files, run commands, and
            iterate autonomously. Use Ask mode for quick questions about tokens or components.
          </li>
          <li>
            <span className="font-medium text-foreground">Reference existing templates.</span> Say
            "look at the Admin Landing story for reference" and the agent will read the existing
            code to match patterns and conventions.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Resources (Use Cases + Best Practices)
// ============================================================================

const resourceSubTabs = ['Best Practices', 'Use Cases', "What's Not in Scope"] as const;
type ResourceSubTab = (typeof resourceSubTabs)[number];

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

function UseCasesContent() {
  return (
    <div className="space-y-8">
      <div>
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
          solution="Start from the Flow template with the Properties Simple panel. Use FlowNode components to populate the canvas, the FlowCanvasToolbar for mode switching, and the FlowPanel for the left navigation rail. Leverage the Flow Properties panel (expanded) for detailed node configuration."
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

function BestPracticesContent() {
  return (
    <div className="space-y-8">
      <div>
        <SectionDescription>
          Guidelines for getting the most out of AI-assisted prototyping with Apollo.
        </SectionDescription>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Setting Up an AI Prototype</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Start from an existing template.</span>
            <br />
            The Maestro, Admin, Delegate, and Flow templates provide production-ready layouts. Fork
            one instead of building from scratch.
          </li>
          <li>
            <span className="font-medium text-foreground">Always include the AI context.</span>
            <br />
            Whether you use the markdown file or MCP, always give the AI context about Apollo before
            prompting. Without it, you'll get generic React output that doesn't match the design
            system.
          </li>
          <li>
            <span className="font-medium text-foreground">Set the theme class first.</span>
            <br />
            Apply{' '}
            <InlineCode>future-dark</InlineCode> or <InlineCode>future-light</InlineCode> to your
            root element before adding any content. This ensures all tokens resolve correctly from
            the start.
          </li>
        </ul>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Writing Effective Prompts</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Be specific about components.</span>
            <br />
            Say "use a shadcn DataTable with sorting and pagination" instead of "add a table." Name
            the exact components you want.
          </li>
          <li>
            <span className="font-medium text-foreground">Reference tokens, not colors.</span>
            <br />
            Say "use bg-surface-raised for the card background" instead of "make the
            background dark gray." This ensures theme consistency.
          </li>
          <li>
            <span className="font-medium text-foreground">Iterate in small steps.</span>
            <br />
            Build the layout first, then add interactions, then refine styling. Large prompts with
            many requirements produce worse results than focused, sequential ones.
          </li>
          <li>
            <span className="font-medium text-foreground">Include layout context.</span>
            <br />
            Mention "fullscreen layout", "sidebar + main content", or "tabbed interface" so the AI
            structures the page correctly from the start.
          </li>
        </ul>
      </div>

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Common Mistakes to Avoid</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Don't use raw Tailwind colors.</span>
            <br />
            Avoid <InlineCode>bg-zinc-900</InlineCode>, <InlineCode>text-gray-400</InlineCode>, etc.
            Always use semantic tokens (<InlineCode>bg-surface</InlineCode>,{' '}
            <InlineCode>text-foreground-muted</InlineCode>).
          </li>
          <li>
            <span className="font-medium text-foreground">Don't install extra UI libraries.</span>
            <br />
            Everything you need is already available in apollo-wind. Adding Material UI, Chakra, or
            other libraries will conflict with the design system.
          </li>
          <li>
            <span className="font-medium text-foreground">Don't skip the theme wrapper.</span>
            <br />
            Components using <InlineCode>future-*</InlineCode> tokens won't render correctly without
            a theme class on a parent element.
          </li>
          <li>
            <span className="font-medium text-foreground">Don't hardcode light/dark values.</span>
            <br />
            The theme system handles this automatically. If you're writing{' '}
            <InlineCode>bg-white</InlineCode> or <InlineCode>bg-black</InlineCode>, you're bypassing
            the design system.
          </li>
        </ul>
      </div>

      <Divider />

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

function WhatNotInScopeContent() {
  return (
    <div className="space-y-8">
      <div>
        <SectionDescription>
          Understanding what's not directly supported and why, plus recommendations for working with
          alternative tools and systems.
        </SectionDescription>
      </div>

      {/* Separate Systems */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">Separate Systems</h3>
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

      {/* v0 and Lovable */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">v0 and Lovable</h3>
        <SectionDescription>
          These web-based AI builders operate differently from code-editor tools like Cursor and Claude
          Code. Here's why they're not directly supported and how to get the most out of them.
        </SectionDescription>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">Why they're not directly supported</h4>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">No MCP support.</span>
                <br />
                Neither tool can connect to the Storybook MCP or Figma MCP servers. They're
                sandboxed web applications without access to your local codebase or MCP
                infrastructure.
              </li>
              <li>
                <span className="font-medium text-foreground">No local file access.</span>
                <br />
                They can't read files from your repository or use{' '}
                <InlineCode>@</InlineCode> references. Context must be manually pasted.
              </li>
              <li>
                <span className="font-medium text-foreground">Different component environments.</span>
                <br />
                Both tools use their own shadcn/ui setup. Import paths, custom Apollo components
                (like <InlineCode>ChatComposer</InlineCode>,{' '}
                <InlineCode>FlowNode</InlineCode>), and our custom design tokens won't exist in
                their generated code.
              </li>
              <li>
                <span className="font-medium text-foreground">No theme CSS.</span>
                <br />
                Our <InlineCode>future-dark</InlineCode> and{' '}
                <InlineCode>future-light</InlineCode> CSS variables won't be available. Output will
                use generic Tailwind colors unless manually adjusted.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">How to use them effectively</h4>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Paste the AI context file.</span>
                <br />
                Copy the contents of{' '}
                <InlineCode>packages/apollo-wind/apollo-ai-context.md</InlineCode> and paste it as
                your system prompt or initial context. This gives the AI knowledge of Apollo
                components, tokens, and patterns.
              </li>
              <li>
                <span className="font-medium text-foreground">Specify theme values explicitly.</span>
                <br />
                Since CSS variables won't resolve, include the actual color values in your prompt.
                For example: "Use dark gray backgrounds (#09090b for surface, #18181b for raised
                surfaces) and cyan accents (#0891b2) to match Apollo's future-dark theme."
              </li>
              <li>
                <span className="font-medium text-foreground">Treat output as a starting point.</span>
                <br />
                The generated code will need adjustment when brought into the Apollo Wind repository.
                Plan to replace generic Tailwind classes with semantic tokens, update import paths,
                and add custom Apollo components where needed.
              </li>
              <li>
                <span className="font-medium text-foreground">Use for rapid ideation.</span>
                <br />
                These tools excel at quick visual prototypes and layout exploration. Use them to
                validate concepts, then refine the code in Cursor or Claude Code with full Apollo
                integration.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourcesTab() {
  const [activeSubTab, setActiveSubTab] = React.useState<ResourceSubTab>('Best Practices');

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Resources</SectionTitle>

        {/* Pill toggle */}
        <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/50 p-1">
          {resourceSubTabs.map((sub) => (
            <button
              key={sub}
              className={cn(
                'cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeSubTab === sub
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveSubTab(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeSubTab === 'Best Practices' && <BestPracticesContent />}
        {activeSubTab === 'Use Cases' && <UseCasesContent />}
        {activeSubTab === "What's Not in Scope" && <WhatNotInScopeContent />}
      </div>
    </div>
  );
}

// ============================================================================
// Prototyping Page
// ============================================================================

const tabs = ['Overview', 'Use Playground', 'Use Figma', 'Use Claude', 'Use Cursor', 'Resources'] as const;
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
          {activeTab === 'Use Playground' && <UsePlaygroundTab />}
          {activeTab === 'Use Figma' && <UseFigmaTab />}
          {activeTab === 'Use Claude' && <UseClaudeTab />}
          {activeTab === 'Use Cursor' && <UseCursorTab />}
          {activeTab === 'Resources' && <ResourcesTab />}
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
