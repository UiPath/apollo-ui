import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Blocks, Check, Code2, LayoutPanelTop, PanelsTopLeft } from 'lucide-react';

const meta = {
  title: 'Templates',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedResponsibilities = [
  'Canvas, nodes, edges, and navigation controls',
  'Panel content and Apollo component composition',
  'Theme tokens, accessibility, and responsive behavior',
  'Open, close, resize, and collapsed states',
];

const hostResponsibilities = [
  'Workspace persistence and saved layouts',
  'Docking orchestration and panel placement',
  'Application data, commands, and permissions',
  'Flow Workbench lifecycle and product integration',
];

function ResponsibilityList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-5 text-foreground-muted">
          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TemplateGuidelinesPage() {
  return (
    <main className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            Canvas templates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Choose the shell. Keep the UI contract.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
            Standalone and VS Code templates share the same Apollo canvas and panel content. They
            differ in who owns layout behavior: the product surface or the workbench host.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-brand/30 bg-brand-subtle p-6">
          <h2 className="text-base font-semibold text-foreground">Implementation rule</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Keep business UI out of Dockview-specific renderers. Build the panel body as a reusable
            Apollo component, demonstrate it in Standalone, then mount the same content inside the
            VS Code adapter. The host may change placement; it should not fork the panel experience.
          </p>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-surface-overlay text-brand">
                <LayoutPanelTop className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Standalone</h2>
                <p className="text-xs text-foreground-muted">Apollo owns the composition</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-foreground-muted">
              Use for product surfaces that render canvas UI directly. Panels float within the
              canvas, preserve Apollo spacing and radius, and expose straightforward state hooks.
            </p>
            <div className="mt-5 rounded-xl border border-border-subtle bg-surface p-4">
              <p className="text-xs font-semibold">Choose Standalone when</p>
              <ResponsibilityList
                items={[
                  'The canvas is the primary product surface',
                  'Apollo should define panel placement and appearance',
                  'You need a complete grab-and-go composition',
                ]}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-surface-overlay text-brand">
                <PanelsTopLeft className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">VS Code</h2>
                <p className="text-xs text-foreground-muted">The workbench owns the composition</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-foreground-muted">
              Use for Flow Workbench-style hosts. Apollo supplies panel content while Dockview owns
              tabs, splits, drop targets, resizing, and persisted workspace arrangement.
            </p>
            <div className="mt-5 rounded-xl border border-border-subtle bg-surface p-4">
              <p className="text-xs font-semibold">Choose VS Code when</p>
              <ResponsibilityList
                items={[
                  'Users arrange multiple tools in a workbench',
                  'Panels must dock, split, tab, and change order',
                  'The host persists and restores the workspace layout',
                ]}
              />
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-border-subtle bg-surface-raised p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <Blocks className="size-5 text-brand" />
            <div>
              <h2 className="text-lg font-semibold">The Flow Workbench consumption path</h2>
              <p className="text-sm text-foreground-muted">
                Build content once; let the correct host compose it.
              </p>
            </div>
          </div>

          <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              {
                eyebrow: 'Apollo components',
                title: 'Reusable UI',
                body: 'Canvas controls, property panels, forms, schemas, and workflow content.',
                icon: Blocks,
              },
              {
                eyebrow: 'Template adapter',
                title: 'Explicit contract',
                body: 'State, callbacks, IDs, sizing constraints, and panel content slots.',
                icon: Code2,
              },
              {
                eyebrow: 'Flow Workbench',
                title: 'Host integration',
                body: 'Dockview layout, persistence, commands, product data, and lifecycle.',
                icon: PanelsTopLeft,
              },
            ].map((step, index) => (
              <div key={step.title} className="contents">
                <div className="rounded-xl border border-border-subtle bg-surface p-4">
                  <step.icon className="size-5 text-foreground-subtle" />
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-subtle">
                    {step.eyebrow}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-foreground-muted">{step.body}</p>
                </div>
                {index < 2 && (
                  <div className="hidden items-center text-foreground-subtle md:flex">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
            <h2 className="text-base font-semibold">Apollo provides</h2>
            <ResponsibilityList items={sharedResponsibilities} />
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
            <h2 className="text-base font-semibold">Flow Workbench provides</h2>
            <ResponsibilityList items={hostResponsibilities} />
          </div>
        </section>
      </div>
    </main>
  );
}

export const TemplateGuide: Story = {
  name: 'Template Guide',
  render: () => <TemplateGuidelinesPage />,
};
