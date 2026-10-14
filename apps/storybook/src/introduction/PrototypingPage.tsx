import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// ============================================================================
// Meta
// ============================================================================

type PrototypingArgs = { tab: string };

const meta: Meta<PrototypingArgs> = {
  title: 'Introduction/Prototyping',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    tab: {
      control: 'select',
      options: ['Overview', 'Skills', 'MCP', 'IDEs & Apps', 'Playground', 'Resources'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Theme helpers
// ============================================================================

function resolveThemeClass(value: string) {
  return value ?? 'future-dark';
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

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Build with the whole Apollo system</SectionTitle>
        <SectionDescription>
          Apollo brings foundations, components, and working examples together in one repository.
          Start with the user journey, choose the right package, and use the shared Storybook to
          ground your prototype in existing UI.
        </SectionDescription>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [
            'Core',
            'Tokens, fonts, icons, and themes. The shared foundation for every surface.',
            'apollo-core-getting-started--default',
          ],
          [
            'Wind',
            'Components and patterns for new React interfaces, forms, navigation, and product layouts.',
            'apollo-wind-getting-started--default',
          ],
          [
            'React',
            'Canvas and workflow experiences, chat, and Material components for existing applications.',
            'apollo-react-getting-started--default',
          ],
        ].map(([name, body, id]) => (
          <a
            key={name}
            href={`/?path=/story/${id}`}
            target="_top"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary focus-visible:outline focus-visible:outline-primary"
          >
            <h3 className="mb-2 font-semibold">Apollo {name}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{body}</p>
          </a>
        ))}
      </div>
      <div className="space-y-6">
        <StepItem step={1} title="Describe the experience">
          <p>
            Name the audience, task, starting point, and success state. Include realistic content
            and the states you want to test.
          </p>
        </StepItem>
        <StepItem step={2} title="Choose existing building blocks">
          <p>
            Use Storybook MCP to find relevant components and stories. Use Core tokens, Wind UI, and
            React canvas components together where the experience needs them.
          </p>
        </StepItem>
        <StepItem step={3} title="Apply skills, then iterate">
          <p>
            Load the relevant Apollo skills, including apollo-writing for UI copy. Build one
            complete interaction, inspect it in the browser, and refine it with feedback.
          </p>
        </StepItem>
      </div>
      <InfoCallout>
        Working in apollo-ui? Follow its repository instructions and source imports. Working in a
        separate prototype? Use the installed packages and their public exports. The Wind AI context
        is a useful supplement, but it does not describe every package in this repository.
      </InfoCallout>
    </div>
  );
}

function StorybookMcpTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Prototype with Storybook MCP</SectionTitle>
        <SectionDescription>
          Give your assistant access to the running Apollo Storybook, then ask it to inspect
          existing examples before writing UI. Pair that evidence with repository source and the
          versions installed in your prototype.
        </SectionDescription>
      </div>
      <StepItem step={1} title="Start the shared Storybook">
        <p>From the apollo-ui repository root, after installing dependencies:</p>
        <CodeBlock label="Terminal">{'pnpm --dir apps/storybook dev'}</CodeBlock>
        <p>
          The shared app includes Core, Wind, and React. Keep it running while the assistant works.
        </p>
      </StepItem>
      <StepItem step={2} title="Connect your assistant">
        <CodeBlock label="Local MCP endpoint">{'http://localhost:6007/mcp'}</CodeBlock>
        <p>
          Use the IDEs &amp; Apps tab for client setup. This is the local development server; a
          published Storybook URL does not necessarily provide an MCP endpoint.
        </p>
      </StepItem>
      <StepItem step={3} title="Verify access before building">
        <CodeBlock label="Connection check">
          {
            'Use the Apollo Storybook MCP connection to find a form or panel example. Tell me which tools you used and which stories you found. If the connection is unavailable, say so before proceeding.'
          }
        </CodeBlock>
      </StepItem>
      <StepItem step={4} title="Give the assistant a concrete brief">
        <CodeBlock label="Example prompt">{`Build a workflow configuration prototype for an operations user.
First use Apollo Storybook MCP to inspect relevant Flow layout,
Node Property Panel, and form examples. Report the stories you will reuse.
Read the matching source and confirm imports against this project's dependencies.
Use Apollo components and semantic theme tokens. Apply apollo-writing
for field labels, helper text, validation, empty states, and action labels.
Include a populated state, an empty state, and a recoverable error.
Make the primary interaction work, then preview and check keyboard use,
light/dark themes, and narrow layouts. Identify any missing components.`}</CodeBlock>
      </StepItem>
      <InfoCallout>
        If the connection fails, check that Storybook is running, the port matches, and the
        assistant can reach your machine. Ask it to report the tools actually available. MCP
        supplies context; browser inspection and relevant tests still verify the result.
      </InfoCallout>
      <p className="text-sm">
        <DocLink href="https://storybook.js.org/addons/@storybook/addon-mcp">
          Storybook MCP documentation
        </DocLink>
      </p>
    </div>
  );
}

function UsePlaygroundTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Apollo Playground</SectionTitle>
        <SectionDescription>
          A local workspace for creating and organizing interactive Apollo prototypes. Use its
          dashboard to start a Flow prototype, open it in your preferred editor or AI app, and
          iterate with real components.
        </SectionDescription>
        <DocLink href="https://github.com/UiPath-Design-Sandbox/apollo-playground">
          Open Apollo Playground on GitHub
        </DocLink>
      </div>
      <StepItem step={1} title="Set up the Playground">
        <p>
          Install Node.js 20 or newer and Git, then follow the repository README for current
          prerequisites.
        </p>
        <CodeBlock label="One-time setup">{`git clone https://github.com/UiPath-Design-Sandbox/apollo-playground.git
cd apollo-playground
npm install
npm run dev`}</CodeBlock>
        <p>
          Open <InlineCode>http://localhost:5173</InlineCode>. The Playground and Apollo Storybook
          are separate local servers.
        </p>
      </StepItem>
      <StepItem step={2} title="Create and iterate">
        <p>
          Choose Create, name the prototype, and select its destination. Use Edit to open the source
          in Cursor, VS Code, Claude, or Codex. Pair the session with Apollo skills and the
          Storybook MCP workflow.
        </p>
      </StepItem>
      <StepItem step={3} title="Review and share">
        <p>
          Test the interaction and themes, then use Save to commit to a prototype branch and attempt
          a push. Teammates pull and run it locally; saving does not create a hosted preview URL.
        </p>
      </StepItem>
      <InfoCallout>
        Imported repository code is reference material in an _imported folder until it is integrated
        with Apollo components. For setup changes and troubleshooting, follow the{' '}
        <DocLink href="https://github.com/UiPath-Design-Sandbox/apollo-playground#readme">
          Playground README
        </DocLink>
        .
      </InfoCallout>
    </div>
  );
}

function UseFigmaTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Bring a Figma design into Apollo</SectionTitle>
        <SectionDescription>
          Use Figma for design intent and Apollo Storybook for the component implementation. Give
          the assistant a specific frame or node link and describe the interactions the static
          design cannot show.
        </SectionDescription>
      </div>
      <StepItem step={1} title="Share the relevant frame">
        <p>
          Connect the Figma tools supported by your client. Provide the frame link, relevant
          variants, and any responsive or interaction notes.
        </p>
      </StepItem>
      <StepItem step={2} title="Map the design to Apollo">
        <p>
          Ask the assistant to inspect the design and find corresponding Apollo stories through MCP.
          Confirm the components and tokens before implementing. Call out gaps rather than silently
          creating replacement components.
        </p>
      </StepItem>
      <StepItem step={3} title="Compare the working result">
        <p>
          Review spacing, typography, content, and state transitions against the design. Apply
          apollo-writing to the real UI text and test keyboard access and themes.
        </p>
      </StepItem>
      <CodeBlock label="Example prompt">
        {
          'Inspect this Figma frame: [frame URL]. Use Apollo Storybook MCP to find matching components and patterns. Explain the mapping and any gaps, then implement the main interaction with realistic content and Apollo theme tokens.'
        }
      </CodeBlock>
    </div>
  );
}

// ============================================================================
// Tab: Use Claude
// ============================================================================

function ToolsTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>IDEs &amp; Apps</SectionTitle>
        <SectionDescription>
          Choose the environment you prefer: an editor such as Cursor or VS Code with an agent, or a
          dedicated app such as Claude or Codex. Give the session access to the prototype folder,
          Apollo guidance, and the running Storybook.
        </SectionDescription>
      </div>
      <InfoCallout>
        Use the same brief everywhere: the user journey, reference stories, relevant skills, and
        acceptance criteria. Before editing, ask the assistant to confirm its project folder and
        available MCP tools.
      </InfoCallout>
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 font-semibold">Cursor</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Merge this server entry into the project's .cursor/mcp.json, then verify it in the
            client.
          </p>
          <CodeBlock label=".cursor/mcp.json">{`{
  "mcpServers": {
    "apollo-storybook": { "url": "http://localhost:6007/mcp" }
  }
}`}</CodeBlock>
          <DocLink href="https://cursor.com/docs/context/mcp">Cursor MCP setup</DocLink>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Claude Code</h3>
          <CodeBlock label="Run from your project">
            {
              'claude mcp add --transport http --scope project apollo-storybook http://localhost:6007/mcp'
            }
          </CodeBlock>
          <p className="mt-3 text-sm">
            <DocLink href="https://code.claude.com/docs/en/mcp">Claude Code MCP setup</DocLink>
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Codex</h3>
          <CodeBlock label="Codex CLI configuration">
            {'codex mcp add apollo-storybook --url http://localhost:6007/mcp'}
          </CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Codex uses MCP configuration shared by its CLI and IDE extension. Verify the connection
            in the client you are using.{' '}
            <DocLink href="https://developers.openai.com/codex/mcp">Official MCP setup</DocLink>
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Desktop apps and other IDEs</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Open the local project in your app's coding workflow and connect Storybook using the MCP
            setup supported there. Claude chat, Claude Code, and other app modes can have different
            file and connector access. A cloud session cannot assume it can reach your laptop's
            localhost. Use the connection check in the MCP tab before starting.
          </p>
        </div>
      </div>
      <CodeBlock label="Start a session">
        {
          'Work in this prototype folder. Read the repository instructions and relevant Apollo skills. Confirm Storybook MCP is available, inspect the closest existing examples, and describe what you will reuse before implementing the requested journey.'
        }
      </CodeBlock>
    </div>
  );
}

const resourceSubTabs = ['Best Practices', 'Figma', 'Use Cases', "What's Not in Scope"] as const;
type ResourceSubTab = (typeof resourceSubTabs)[number];

function PersonaCard({
  persona,
  icon,
  scenario,
  solution,
  outcome,
}: {
  persona: string;
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
        <h4 className="text-base font-semibold text-foreground">{persona}</h4>
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
          Apollo is built for anyone who needs to create product experiences quickly, whether you're
          pitching a customer, validating a design, or building a proof of concept. Here's how
          different roles use the system to turn ideas into working prototypes.
        </SectionDescription>
      </div>

      <div className="space-y-6">
        <PersonaCard
          persona="Product Manager"
          icon="📋"
          scenario="A supply chain customer needs to visualize their automation workflows and monitor performance across 50+ processes. They want a dashboard that shows analytics, status, and trends at a glance."
          solution="Start from the Maestro Dashboard template. Use the DataTable component for process listings with sorting and filtering. Add StatsCards for KPIs (throughput, error rate, uptime) and the Tabs component to organize views by Overview, Analytics, and Reports."
          outcome="A fully interactive dashboard prototype you can demo to the customer, built in hours rather than weeks. Because it uses the same components as production, the engineering team can adopt it directly."
        />

        <PersonaCard
          persona="Designer"
          icon="🎨"
          scenario="A developer is building complex automation workflows and needs to understand how the platform handles scale. They want a Flow demo showing how the system manages 100+ workflow steps with branching logic."
          solution="Start from the Flow template with Apollo React BaseNode components on the canvas. Supply Apollo React canvas controls and NodePropertyPanel through the template control and panel slots."
          outcome="A high-fidelity flow editor prototype that demonstrates scale and interaction patterns. Feed the AI context file to Cursor or Claude and iterate on the layout in real time. Every component is already themed and accessible."
        />

        <PersonaCard
          persona="Engineer"
          icon="🛠️"
          scenario="A customer needs to consolidate and format complex Excel documents into a presentation-ready format. They want a Delegate-style interface where an AI assistant guides the user through the process step by step."
          solution="Start from the Delegate template with the sidebar navigation panel. Use the ChatComposer and ChatStepsView custom components for the AI assistant interaction. Add FileUpload for document ingestion, and use Card and DataTable components to preview the transformed output."
          outcome="A working prototype that shows the end-to-end user experience, from uploading files to reviewing AI-generated output. The prototype runs in Storybook, so stakeholders can interact with it directly in a browser."
        />
      </div>

      <Divider />

      <InfoCallout>
        These are starting points. Every template and component in Apollo is composable, so mix and
        match to fit your specific customer scenario. Browse the Templates section in the Storybook
        sidebar to see what's available.
      </InfoCallout>
    </div>
  );
}

// ============================================================================
// Skills data
// ============================================================================

type SkillSurface = 'Cursor' | 'Claude Code';

interface Skill {
  name: string;
  description: string;
  category: string;
  surfaces: SkillSurface[];
  sourcePath: string;
}

const SKILLS: Skill[] = [
  {
    name: 'apollo-install',
    description: 'Use when setting up Apollo locally and starting Storybook.',
    category: 'Setup',
    surfaces: ['Cursor', 'Claude Code'],
    sourcePath: 'packages/apollo-wind/skills/apollo-install/',
  },
  {
    name: 'apollo-repo-sync',
    description: 'Use when adding or updating Apollo Wind in a separate prototype repository.',
    category: 'Setup',
    surfaces: ['Cursor', 'Claude Code'],
    sourcePath: 'packages/apollo-wind/skills/apollo-repo-sync/',
  },
  {
    name: 'apollo-prototype',
    description: 'Use when building an Apollo Wind prototype with its components and theme tokens.',
    category: 'Prototype',
    surfaces: ['Cursor', 'Claude Code'],
    sourcePath: 'packages/apollo-wind/skills/apollo-prototype/',
  },
  {
    name: 'apollo-writing',
    description: 'Use when writing or reviewing labels, helper text, errors, and other UI copy.',
    category: 'Writing',
    surfaces: ['Cursor', 'Claude Code'],
    sourcePath: 'packages/apollo-wind/skills/apollo-writing/',
  },
];

const SURFACE_COLORS: Record<SkillSurface, string> = {
  Cursor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Claude Code': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function SurfaceBadge({ surface }: { surface: SkillSurface }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        SURFACE_COLORS[surface]
      )}
    >
      {surface}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {category}
    </span>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(skill.sourcePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-4 border-b border-border px-4 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
            {skill.name}
          </code>
          <CategoryBadge category={skill.category} />
          <div className="flex flex-wrap gap-1.5">
            {skill.surfaces.map((s) => (
              <SurfaceBadge key={s} surface={s} />
            ))}
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{skill.description}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 cursor-pointer rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {copied ? 'Copied!' : 'Copy path'}
      </button>
    </div>
  );
}

// ============================================================================
// Tab: Skills
// ============================================================================

function SkillsTab() {
  const [activeView, setActiveView] = React.useState<
    'Set up' | 'Apollo skills' | 'UiPath skills' | 'Create a skill'
  >('Set up');

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Skills</SectionTitle>
        <SectionDescription>
          Find a skill, add it to your project, and use it in a request.
        </SectionDescription>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {(['Set up', 'Apollo skills', 'UiPath skills', 'Create a skill'] as const).map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={activeView === view}
            onClick={() => setActiveView(view)}
            className={cn(
              'cursor-pointer px-4 py-3 text-sm font-medium transition-colors',
              activeView === view
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {view}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeView === 'Set up' && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Set up a skill</h3>
            <div className="space-y-5">
              <StepItem step={1} title="Find the skill">
                <p>
                  Choose from the Apollo skills tab, or open the full lists of{' '}
                  <DocLink href="https://github.com/UiPath/apollo-ui/tree/main/packages/apollo-wind/skills">
                    Apollo design skills
                  </DocLink>{' '}
                  and{' '}
                  <DocLink href="https://github.com/UiPath/apollo-ui/tree/main/.claude/skills">
                    repository maintenance skills
                  </DocLink>
                  . Read the skill’s SKILL.md to confirm when it applies.
                </p>
              </StepItem>
              <StepItem step={2} title="Add the complete folder to your project">
                <p>
                  For Cursor, use <InlineCode>.cursor/skills/&lt;skill-name&gt;/</InlineCode>; for
                  Claude Code, use <InlineCode>.claude/skills/&lt;skill-name&gt;/</InlineCode>; for
                  Codex, use <InlineCode>.agents/skills/&lt;skill-name&gt;/</InlineCode>. Keep any
                  referenced files beside SKILL.md.
                </p>
              </StepItem>
              <StepItem step={3} title="Use it in your request">
                <p>
                  Name the skill and the work you want done. For a one-off task, you can also point
                  a local-file-capable assistant directly to SKILL.md and its references.
                </p>
              </StepItem>
            </div>
          </div>
        )}

        {activeView === 'Apollo skills' && (
          <>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Choose a skill</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Pick the task that matches your work. Copy its path to use it with your assistant.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {SKILLS.map((skill) => (
                <SkillRow key={skill.name} skill={skill} />
              ))}
            </div>

            <InfoCallout>
              <strong className="text-foreground">Include writing from the start.</strong> Use
              apollo-writing while building forms, actions, and feedback, then run a copy review
              before sharing. Keep its entire folder: SKILL.md references the accompanying content
              patterns.
            </InfoCallout>
            <CodeBlock label="Build and review with skills">{`Read packages/apollo-wind/skills/apollo-prototype/SKILL.md and
packages/apollo-wind/skills/apollo-writing/SKILL.md, plus the content
patterns relevant to this screen. Build the form using existing Apollo
components. Review labels, helper text, errors, and the submit action.
Return the revised copy and explain any missing context.`}</CodeBlock>
            <p className="text-sm leading-6 text-muted-foreground">
              Use apollo-install for initial setup, apollo-repo-sync when bringing Apollo Wind into
              a separate prototype, apollo-prototype for Wind implementation, and apollo-writing
              across UI copy. Check the current repository README and package scripts for setup
              versions and commands; older skill setup instructions may refer to the Wind-only
              Storybook.
            </p>
            <InfoCallout>
              These skills live under Apollo Wind, so their component and import guidance is
              Wind-specific. For Core and React, pair them with the corresponding Getting Started
              page and source examples. In any client that can read local files, reference the full
              SKILL.md path and ask it to load linked resources. Use the client's documented skill
              installation flow for automatic discovery.
            </InfoCallout>
          </>
        )}

        {activeView === 'UiPath skills' && (
          <>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">UiPath agent skills</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                The company-wide collection covers building and operating UiPath automations,
                agents, Maestro flows, coded apps, and platform services. Browse the catalog to
                choose the skill that matches your product task.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-sm leading-6 text-muted-foreground">
                For example, use <InlineCode>uipath-maestro-flow</InlineCode> for Flow authoring,
                <InlineCode>uipath-agents</InlineCode> for agents, or{' '}
                <InlineCode>uipath-review</InlineCode> for a read-only review. Check each skill's
                status in the catalog before relying on it.
              </p>
              <DocLink href="https://github.com/UiPath/skills">Browse all UiPath skills →</DocLink>
            </div>
            <InfoCallout>
              For ongoing use, follow the repository's installation guide, which recommends{' '}
              <InlineCode>uip skills install</InlineCode>. These product skills complement the
              Apollo skills for UI components and writing.
            </InfoCallout>
          </>
        )}

        {activeView === 'Create a skill' && (
          <>
            <div className="border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
              <p className="mb-0.5 font-medium text-foreground">Want to contribute a skill?</p>
              <p>
                Add it to <InlineCode>packages/apollo-wind/skills/</InlineCode> and open a PR. See{' '}
                <span className="font-medium text-foreground">Create Your Own Skill</span> below for
                what to include. If you can't open a PR, post it to the{' '}
                <a
                  href="https://uipath.enterprise.slack.com/archives/C0172850BEH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  #apollo
                </a>{' '}
                Slack channel and the team will handle it.
              </p>
            </div>

            {/* Create your own */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">Create Your Own Skill</h3>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">
                If you need custom rules or workflows, create a skill that encodes Apollo
                conventions:
              </p>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">What to include.</span>
                  <br />
                  Apollo semantic tokens, theme classes (<InlineCode>future-dark</InlineCode>,{' '}
                  <InlineCode>future-light</InlineCode>), component import paths, and rules from{' '}
                  <InlineCode>apollo-ai-context.md</InlineCode>.
                </li>
                <li>
                  <span className="font-medium text-foreground">References.</span>
                  <br />
                  Use Cursor's create-skill or Codex's skill-creator for the mechanics. Focus your
                  skill description on Apollo-specific triggers (e.g., "Use when building Apollo
                  prototypes or UI with apollo-wind").
                </li>
              </ul>
            </div>

            {/* Common mistakes */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">
                    Don't use raw Tailwind colors.
                  </span>
                  <br />
                  Avoid <InlineCode>bg-zinc-900</InlineCode>, <InlineCode>text-gray-400</InlineCode>
                  , etc. Always use semantic tokens (<InlineCode>bg-surface</InlineCode>,{' '}
                  <InlineCode>text-foreground-muted</InlineCode>).
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Don't install extra UI libraries.
                  </span>
                  <br />
                  Everything you need is already available in apollo-wind. Adding Material UI,
                  Chakra, or other libraries will conflict with the design system.
                </li>
                <li>
                  <span className="font-medium text-foreground">Don't skip the theme wrapper.</span>
                  <br />
                  Components using <InlineCode>future-*</InlineCode> tokens won't render correctly
                  without a theme class on a parent element.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Don't hardcode light/dark values.
                  </span>
                  <br />
                  The theme system handles this automatically. If you're writing{' '}
                  <InlineCode>bg-white</InlineCode> or <InlineCode>bg-black</InlineCode>, you're
                  bypassing the design system.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BestPracticesContent() {
  return (
    <div className="space-y-8">
      <div>
        <SectionDescription>
          Guidelines for getting the most out of AI-assisted prototyping with Apollo Wind.
        </SectionDescription>
      </div>

      <InfoCallout>
        These implementation details apply to Apollo Wind. For Apollo Core or Apollo React, start
        with that package’s Getting Started page and its component examples.
      </InfoCallout>

      <Accordion type="multiple" defaultValue={['setting-up']} className="w-full">
        <AccordionItem value="setting-up" className="border rounded-lg px-4 mb-3">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Setting Up an AI Prototype
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground pt-1">
              <li>
                <span className="font-medium text-foreground">
                  Start from an existing template.
                </span>
                <br />
                The Maestro, Admin, Delegate, and Flow templates provide production-ready layouts.
                Fork one instead of building from scratch.
              </li>
              <li>
                <span className="font-medium text-foreground">Always include the AI context.</span>
                <br />
                Whether you use the markdown file or MCP, always give the AI context about Apollo
                before prompting. Without it, you'll get generic React output that doesn't match the
                design system.
              </li>
              <li>
                <span className="font-medium text-foreground">Set the theme class first.</span>
                <br />
                Apply <InlineCode>future-dark</InlineCode> or <InlineCode>future-light</InlineCode>{' '}
                to your root element before adding any content. This ensures all tokens resolve
                correctly from the start.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prompts" className="border rounded-lg px-4 mb-3">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Writing Effective Prompts
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground pt-1">
              <li>
                <span className="font-medium text-foreground">Be specific about components.</span>
                <br />
                Say "use a shadcn DataTable with sorting and pagination" instead of "add a table."
                Name the exact components you want.
              </li>
              <li>
                <span className="font-medium text-foreground">Reference tokens, not colors.</span>
                <br />
                Say "use bg-surface-raised for the card background" instead of "make the background
                dark gray." This ensures theme consistency.
              </li>
              <li>
                <span className="font-medium text-foreground">Iterate in small steps.</span>
                <br />
                Build the layout first, then add interactions, then refine styling. Large prompts
                with many requirements produce worse results than focused, sequential ones.
              </li>
              <li>
                <span className="font-medium text-foreground">Include layout context.</span>
                <br />
                Mention "fullscreen layout", "sidebar + main content", or "tabbed interface" so the
                AI structures the page correctly from the start.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="checklist" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Prototype Review Checklist
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Before sharing a prototype, verify these items:
            </p>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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
          The following are separate systems and not part of the Apollo Wind prototyping workflow:
        </SectionDescription>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li>
            <InlineCode>apollo-angular</InlineCode>, Angular Material component library
          </li>
          <li>Web Components (ap-chat, ap-data-grid)</li>
        </ul>
      </div>

      <Divider />

      {/* v0 and Lovable */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-foreground">v0 and Lovable</h3>
        <SectionDescription>
          These web-based AI builders operate differently from code-editor tools like Cursor and
          Claude Code. Here's why they're not directly supported and how to get the most out of
          them.
        </SectionDescription>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">
              Why they're not directly supported
            </h4>
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
                They can't read files from your repository or use <InlineCode>@</InlineCode>{' '}
                references. Context must be manually pasted.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Different component environments.
                </span>
                <br />
                Both tools use their own shadcn/ui setup. Import paths, custom Apollo components
                (like <InlineCode>ChatComposer</InlineCode>), and our custom design tokens won't
                exist in their generated code.
              </li>
              <li>
                <span className="font-medium text-foreground">No theme CSS.</span>
                <br />
                Our <InlineCode>future-dark</InlineCode> and <InlineCode>future-light</InlineCode>{' '}
                CSS variables won't be available. Output will use generic Tailwind colors unless
                manually adjusted.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">
              How to use them effectively
            </h4>
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
                <span className="font-medium text-foreground">
                  Specify theme values explicitly.
                </span>
                <br />
                Since CSS variables won't resolve, include the actual color values in your prompt.
                For example: "Use dark gray backgrounds (#09090b for surface, #18181b for raised
                surfaces) and cyan accents (#0891b2) to match Apollo's future-dark theme."
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Treat output as a starting point.
                </span>
                <br />
                The generated code will need adjustment when brought into the Apollo Wind
                repository. Plan to replace generic Tailwind classes with semantic tokens, update
                import paths, and add custom Apollo components where needed.
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
              type="button"
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
        {activeSubTab === 'Figma' && <UseFigmaTab />}
        {activeSubTab === "What's Not in Scope" && <WhatNotInScopeContent />}
      </div>
    </div>
  );
}

// ============================================================================
// Prototyping Page
// ============================================================================

const tabs = ['Overview', 'Skills', 'MCP', 'IDEs & Apps', 'Playground', 'Resources'] as const;
type TabId = (typeof tabs)[number];

function PrototypingPage({
  globalTheme,
  initialTab = 'Overview',
  onTabChange,
}: {
  globalTheme: string;
  initialTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<TabId>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const activeThemeClass = resolveThemeClass(globalTheme);

  return (
    <div
      className={cn(activeThemeClass, 'min-h-screen w-full bg-background text-foreground')}
      style={{ fontFamily: fontFamily.base }}
    >
      <div className="mx-auto max-w-4xl space-y-2 px-8 py-16">
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
        <div className="flex flex-wrap gap-1 border-b border-border pt-4 pb-0">
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
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Skills' && <SkillsTab />}
          {activeTab === 'MCP' && <StorybookMcpTab />}
          {activeTab === 'Playground' && <UsePlaygroundTab />}
          {activeTab === 'IDEs & Apps' && <ToolsTab />}
          {activeTab === 'Resources' && <ResourcesTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const PrototypingStory: Story = {
  argTypes: meta.argTypes,
  args: {
    tab: 'Overview',
  },
  render: (args, { globals, updateArgs }) => (
    <PrototypingPage
      globalTheme={globals.theme || 'future-dark'}
      initialTab={args.tab as TabId}
      onTabChange={(tab) => updateArgs({ tab })}
    />
  ),
};
