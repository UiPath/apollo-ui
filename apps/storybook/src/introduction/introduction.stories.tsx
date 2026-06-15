import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

const meta = {
  title: 'Introduction',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Primitives
// ============================================================================

function Divider() {
  return <div className="my-10 h-px bg-border" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground">
      {children}
    </code>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">{children}</h2>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-base leading-7 text-muted-foreground">{children}</p>;
}

// ============================================================================
// Package card
// ============================================================================

function PackageCard({
  name,
  packageName,
  description,
  tags,
  storyPath,
  accent,
}: {
  name: string;
  packageName: string;
  description: string;
  tags: string[];
  storyPath: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <div className={`inline-block h-1.5 w-8 rounded-full ${accent}`} />
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <InlineCode>{packageName}</InlineCode>
        <a
          href={`/?path=${storyPath}`}
          target="_parent"
          className="self-start rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted no-underline"
        >
          Explore docs →
        </a>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Decision row
// ============================================================================

function DecisionRow({
  scenario,
  recommendation,
  pkg,
}: {
  scenario: string;
  recommendation: string;
  pkg: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{scenario}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{recommendation}</p>
      </div>
      <InlineCode>{pkg}</InlineCode>
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

function IntroductionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-8 py-16">
        {/* Hero */}
        <div className="mb-16">
          <div className="mb-4 flex items-center gap-2">
            <Tag>Open Source</Tag>
            <Tag>UiPath</Tag>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Apollo Design System
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            The UiPath open-source design system. Shared tokens, React components, and Tailwind
            utilities for building consistent product experiences across web apps and canvas
            editors.
          </p>
        </div>

        {/* Repository */}
        <div className="mb-10 flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-foreground">UiPath/apollo-ui</p>
            <p className="text-xs text-muted-foreground">
              Open source on GitHub. Contributions welcome.
            </p>
          </div>
          <a
            href="https://github.com/UiPath/apollo-ui"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted no-underline"
          >
            View on GitHub →
          </a>
        </div>

        <Divider />

        {/* Packages */}
        <div className="mb-12">
          <SectionHeading>Three packages, one system</SectionHeading>
          <SectionDescription>
            Apollo is split into focused packages. Pick the one that matches your use case, or
            combine them.
          </SectionDescription>
          <div className="grid gap-4 sm:grid-cols-3">
            <PackageCard
              name="Apollo Wind"
              packageName="@uipath/apollo-wind"
              description="Tailwind CSS components built on shadcn/ui and Radix primitives. The recommended starting point for new React applications."
              tags={['Tailwind CSS', 'shadcn/ui', 'New apps']}
              storyPath="/story/apollo-wind-introduction-getting-started--default"
              accent="bg-violet-500"
            />
            <PackageCard
              name="Apollo React"
              packageName="@uipath/apollo-react"
              description="Canvas components for workflow and node-based editors built on React Flow, plus a Material UI theme for existing apps."
              tags={['React Flow', 'Canvas', 'Material UI']}
              storyPath="/story/apollo-react-canvas-introduction-getting-started--default"
              accent="bg-blue-500"
            />
            <PackageCard
              name="Apollo Core"
              packageName="@uipath/apollo-core"
              description="Framework-agnostic design tokens: colors, typography, spacing, icons, and CSS custom properties. The foundation everything else is built on."
              tags={['Tokens', 'CSS vars', 'Any framework']}
              storyPath="/story/apollo-core-introduction-getting-started--default"
              accent="bg-emerald-500"
            />
          </div>
        </div>

        <Divider />

        {/* Which package */}
        <div className="mb-12">
          <SectionHeading>Which package do I need?</SectionHeading>
          <SectionDescription>
            Not sure where to start? Match your situation to the right package.
          </SectionDescription>
          <div className="flex flex-col gap-2">
            <DecisionRow
              scenario="Building a new React app or component library"
              recommendation="Start here. Modern components, dark mode, and accessibility out of the box."
              pkg="apollo-wind"
            />
            <DecisionRow
              scenario="Building a workflow canvas, node editor, or diagram tool"
              recommendation="Canvas components built on React Flow with drag, resize, and property panels"
              pkg="apollo-react/canvas"
            />
            <DecisionRow
              scenario="Theming an existing Material UI app"
              recommendation="Drop-in MUI theme overrides that apply Apollo tokens to your existing components"
              pkg="apollo-react/material"
            />
            <DecisionRow
              scenario="Using a non-React framework (Vue, Web Components, vanilla CSS)"
              recommendation="Import CSS custom properties and icon assets with no framework dependency."
              pkg="apollo-core"
            />
            <DecisionRow
              scenario="Adding Apollo tokens to a custom design tool or token pipeline"
              recommendation="Raw JSON and SCSS token exports for Style Dictionary, Figma Tokens, and similar"
              pkg="apollo-core"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const Overview: Story = {
  render: () => <IntroductionPage />,
};
