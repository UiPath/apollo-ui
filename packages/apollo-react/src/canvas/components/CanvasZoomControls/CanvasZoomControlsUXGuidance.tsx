import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Switch } from '@uipath/apollo-wind';
import { BrushCleaning, Ellipsis } from 'lucide-react';
import * as React from 'react';
import { createNode, useCanvasStory } from '../../storybook-utils';
import { CanvasIcon } from '../../utils/icon-registry';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

const tidyUpOptions: TidyUpMenuOption[] = [
  { id: 'subtle', label: 'Subtle align', icon: 'grid-3x3' },
  { id: 'compact', label: 'Compact layout', icon: 'shrink' },
  { id: 'horizontal', label: 'Horizontal layout', icon: 'move-horizontal' },
  { id: 'vertical', label: 'Vertical layout', icon: 'move-vertical' },
];

const exampleNodes: Node[] = [
  createNode({
    id: 'trigger',
    type: 'uipath.manual-trigger',
    position: { x: 35, y: 115 },
    display: { label: 'New request' },
  }),
  createNode({
    id: 'review',
    type: 'uipath.blank-node',
    position: { x: 300, y: 55 },
    display: { label: 'Review request' },
  }),
  createNode({
    id: 'notify',
    type: 'uipath.blank-node',
    position: { x: 555, y: 150 },
    display: { label: 'Notify owner' },
  }),
];

const exampleEdges: Edge[] = [
  {
    id: 'trigger-review',
    source: 'trigger',
    target: 'review',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
  {
    id: 'review-notify',
    source: 'review',
    target: 'notify',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
      {children}
    </p>
  );
}

function ScopeCard({
  icon,
  eyebrow,
  title,
  description,
  affects,
  availability,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  affects: string;
  availability: string;
}) {
  return (
    <article className="flex min-h-[280px] flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-8 flex items-start justify-between">
        <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {eyebrow}
        </span>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Affects</dt>
          <dd className="mt-1 font-medium text-foreground">{affects}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Available</dt>
          <dd className="mt-1 font-medium text-foreground">{availability}</dd>
        </div>
      </dl>
    </article>
  );
}

function LiveExample() {
  const { canvasProps } = useCanvasStory({
    initialNodes: exampleNodes,
    initialEdges: exampleEdges,
  });
  const [lastAction, setLastAction] = React.useState('Choose a Tidy up strategy');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Core component use</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Keep the global control anchored to the canvas viewport.
          </p>
        </div>
        <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline">
          {lastAction}
        </span>
      </div>
      <div className="h-[360px] bg-background">
        <BaseCanvas {...canvasProps} mode="design">
          <Panel position="bottom-right">
            <CanvasZoomControls
              tidyUpOptions={tidyUpOptions}
              onTidyUpSelect={(id) => {
                const option = tidyUpOptions.find((item) => item.id === id);
                setLastAction(option?.label ?? id);
              }}
            />
          </Panel>
        </BaseCanvas>
      </div>
    </div>
  );
}

function GuidanceRow({
  strategy,
  useWhen,
  result,
}: {
  strategy: string;
  useWhen: string;
  result: string;
}) {
  return (
    <div className="grid gap-2 border-t border-border py-4 first:border-t-0 sm:grid-cols-[150px_1fr_1fr] sm:gap-6">
      <p className="text-sm font-semibold text-foreground">{strategy}</p>
      <p className="text-sm leading-6 text-muted-foreground">{useWhen}</p>
      <p className="text-sm leading-6 text-muted-foreground">{result}</p>
    </div>
  );
}

function AlignmentHintsConcept() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-muted/20 p-8">
      <div className="w-48 rounded-lg border border-border bg-popover p-1 shadow-xl">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
          <CanvasIcon icon="undo-2" size={16} />
          <span>Undo Tidy up</span>
        </div>
        <div className="my-1 h-px bg-border" />

        {tidyUpOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground"
          >
            <CanvasIcon icon={option.icon as string} size={16} />
            <span>{option.label}</span>
          </div>
        ))}

        <div className="my-1 h-px bg-border" />
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
          <span className="text-sm text-foreground">Alignment hints</span>
          <Switch
            size="sm"
            checked={enabled}
            aria-label="Toggle alignment hints concept"
            onCheckedChange={setEnabled}
          />
        </div>
      </div>
    </div>
  );
}

export function CanvasZoomControlsUXGuidance({ globalTheme }: { globalTheme: string }) {
  return (
    <main className={`${globalTheme || 'future-dark'} min-h-screen bg-background text-foreground`}>
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 sm:py-16">
        <header className="max-w-3xl">
          <Eyebrow>UX Guidance</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
            Tidy up without surprises
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Tidy up helps people restore order without making them guess how much of their workflow
            will move. The entry point communicates the scope.
          </p>
        </header>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Location sets the expectation
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Avoid duplicate global actions.
              </strong>{' '}
              If the hover-menu command moves the entire workflow, keep Tidy up in the bottom-right
              control only. A contextual location promises a contextual result.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ScopeCard
              icon={<BrushCleaning size={19} />}
              eyebrow="Global"
              title="Bottom-right Tidy up"
              description="Use the persistent canvas control when a layout strategy should reorganize the workflow as a whole."
              affects="Entire workflow"
              availability="Always visible"
            />
            <ScopeCard
              icon={<Ellipsis size={20} />}
              eyebrow="Contextual"
              title="Hover-menu Tidy up"
              description="Use the node overflow when the action is limited to the current node, selection, branch, or group."
              affects="Current context"
              availability="On hover or selection"
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Match the strategy to the intent
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card px-5 sm:px-6">
            <div className="hidden grid-cols-[150px_1fr_1fr] gap-6 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:grid">
              <span>Strategy</span>
              <span>Use when</span>
              <span>Expected result</span>
            </div>
            <GuidanceRow
              strategy="Subtle align"
              useWhen="The workflow is already understandable but spacing feels uneven."
              result="Nudge nodes onto a shared rhythm while preserving the overall shape."
            />
            <GuidanceRow
              strategy="Compact layout"
              useWhen="The graph has grown organically and needs a clearer reading order."
              result="Reflow the workflow and reduce unnecessary space."
            />
            <GuidanceRow
              strategy="Horizontal layout"
              useWhen="The process should read from left to right."
              result="Reflow nodes horizontally and keep handles on the left and right."
            />
            <GuidanceRow
              strategy="Vertical layout"
              useWhen="The process should read from top to bottom."
              result="Reflow nodes vertically and move handles to the top and bottom."
            />
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Reference implementation
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Let people choose the right degree of change. Use{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">tidyUpOptions</code>{' '}
              when multiple layout strategies are available. Use{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">onOrganize</code>{' '}
              only when one predictable action can run immediately.
            </p>
          </div>
          <LiveExample />
        </section>

        <section className="mt-16">
          <div className="mb-5 max-w-3xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Open question
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Should manual alignment hints be configurable?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Alignment hints support precise manual placement and complement Tidy up without being
              part of it. If optional, should the Tidy up menu also provide a persistent on or off
              control?
            </p>
          </div>
          <AlignmentHintsConcept />
        </section>
      </div>
    </main>
  );
}
