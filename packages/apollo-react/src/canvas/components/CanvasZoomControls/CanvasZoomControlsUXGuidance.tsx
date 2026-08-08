import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Switch } from '@uipath/apollo-wind';
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceAround,
  BrushCleaning,
  ChevronRight,
  Clipboard,
  Copy,
  Ellipsis,
  Layers,
  Scissors,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { createNode, useCanvasStory } from '../../storybook-utils';
import { CanvasIcon } from '../../utils/icon-registry';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasZoomControls, type TidyUpMenuOption } from './CanvasZoomControls';

const tidyUpOptions: TidyUpMenuOption[] = [
  { id: 'subtle', label: 'Align subtly', icon: 'grid-3x3' },
  { id: 'compact', label: 'Make compact', icon: 'shrink' },
  { id: 'horizontal', label: 'Lay out horizontally', icon: 'move-horizontal' },
  { id: 'vertical', label: 'Lay out vertically', icon: 'move-vertical' },
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

type MenuFlyout = 'tidy' | 'align' | 'distribute';

function MenuCommand({
  icon,
  label,
  shortcut,
  active = false,
  disabled = false,
  flyout = false,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  flyout?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        disabled
          ? 'cursor-not-allowed text-muted-foreground opacity-50'
          : `text-foreground ${active ? 'bg-accent' : 'hover:bg-accent/60'}`
      }`}
      aria-expanded={flyout ? active : undefined}
      disabled={disabled}
      onClick={onSelect}
      onMouseEnter={flyout ? onSelect : undefined}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[11px] text-muted-foreground">{shortcut}</span>}
      {flyout && <ChevronRight size={14} className="text-muted-foreground" />}
    </button>
  );
}

function MenuFlyoutPanel({
  flyout,
  hintsEnabled,
  canUndo,
  onHintsChange,
  onAction,
}: {
  flyout: MenuFlyout;
  hintsEnabled: boolean;
  canUndo: boolean;
  onHintsChange: (checked: boolean) => void;
  onAction: (label: string) => void;
}) {
  if (flyout === 'tidy') {
    return (
      <>
        <MenuCommand
          icon={<CanvasIcon icon="undo-2" size={15} />}
          label="Undo Tidy up"
          disabled={!canUndo}
          onSelect={() => onAction('Undo Tidy up')}
        />
        <div className="my-1 h-px bg-border" />
        {tidyUpOptions.map((option) => (
          <MenuCommand
            key={option.id}
            icon={<CanvasIcon icon={option.icon as string} size={15} />}
            label={option.label}
            onSelect={() => onAction(option.label)}
          />
        ))}
      </>
    );
  }

  const items =
    flyout === 'align'
      ? [
          { label: 'Align left', icon: AlignHorizontalJustifyStart, separated: false },
          { label: 'Align center', icon: AlignHorizontalJustifyCenter, separated: false },
          { label: 'Align right', icon: AlignHorizontalJustifyEnd, separated: false },
          { label: 'Align top', icon: AlignVerticalJustifyStart, separated: true },
          { label: 'Align middle', icon: AlignVerticalJustifyCenter, separated: false },
          { label: 'Align bottom', icon: AlignVerticalJustifyEnd, separated: false },
        ]
      : [
          { label: 'Distribute horizontally', icon: AlignHorizontalSpaceAround, separated: false },
          { label: 'Distribute vertically', icon: AlignVerticalSpaceAround, separated: false },
        ];

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <React.Fragment key={item.label}>
            {item.separated && <div className="my-1 h-px bg-border" />}
            <MenuCommand
              icon={<Icon size={15} />}
              label={item.label}
              onSelect={() => onAction(item.label)}
            />
          </React.Fragment>
        );
      })}
      {flyout === 'align' && (
        <>
          <div className="my-1 h-px bg-border" />
          <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
            <span className="text-[13px] text-foreground">Alignment hints</span>
            <Switch
              size="sm"
              checked={hintsEnabled}
              aria-label="Toggle alignment hints concept"
              onCheckedChange={onHintsChange}
            />
          </div>
        </>
      )}
    </>
  );
}

function MenuStateExample({ selected }: { selected: boolean }) {
  const [openFlyout, setOpenFlyout] = React.useState<MenuFlyout>('tidy');
  const [hintsEnabled, setHintsEnabled] = React.useState(true);
  const [canUndo, setCanUndo] = React.useState(false);
  const [lastAction, setLastAction] = React.useState('Choose an action');

  const handleAction = (label: string) => {
    setLastAction(label);
    if (label === 'Undo Tidy up') {
      setCanUndo(false);
    } else if (tidyUpOptions.some((option) => option.label === label)) {
      setCanUndo(true);
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {selected ? 'Selection menu' : 'Canvas menu'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {selected ? 'Multiple nodes selected' : 'Nothing selected'}
          </p>
        </div>
        <span className="max-w-36 truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          {lastAction}
        </span>
      </div>

      <div className="grid min-h-[320px] grid-cols-2 items-start gap-2 rounded-xl bg-muted/20 p-3">
        <div className="rounded-lg border border-border bg-popover p-1 shadow-lg">
          <MenuCommand
            icon={<BrushCleaning size={15} />}
            label={selected ? 'Tidy selected' : 'Tidy up'}
            active={openFlyout === 'tidy'}
            flyout
            onSelect={() => setOpenFlyout('tidy')}
          />

          {selected ? (
            <>
              <MenuCommand
                icon={<AlignStartHorizontal size={15} />}
                label="Align"
                active={openFlyout === 'align'}
                flyout
                onSelect={() => setOpenFlyout('align')}
              />
              <MenuCommand
                icon={<AlignHorizontalSpaceAround size={15} />}
                label="Distribute"
                active={openFlyout === 'distribute'}
                flyout
                onSelect={() => setOpenFlyout('distribute')}
              />
              <div className="my-1 h-px bg-border" />
              <MenuCommand
                icon={<Copy size={15} />}
                label="Copy"
                shortcut="⌘C"
                onSelect={() => handleAction('Copy')}
              />
              <MenuCommand
                icon={<Scissors size={15} />}
                label="Cut"
                shortcut="⌘X"
                onSelect={() => handleAction('Cut')}
              />
              <MenuCommand
                icon={<Clipboard size={15} />}
                label="Paste"
                shortcut="⌘V"
                onSelect={() => handleAction('Paste')}
              />
              <MenuCommand
                icon={<Layers size={15} />}
                label="Convert to subflow"
                onSelect={() => handleAction('Convert to subflow')}
              />
              <div className="my-1 h-px bg-border" />
              <MenuCommand
                icon={<Trash2 size={15} />}
                label="Delete"
                shortcut="⌫"
                onSelect={() => handleAction('Delete')}
              />
            </>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-popover p-1 shadow-lg">
          <MenuFlyoutPanel
            flyout={selected ? openFlyout : 'tidy'}
            hintsEnabled={hintsEnabled}
            canUndo={canUndo}
            onHintsChange={(checked) => {
              setHintsEnabled(checked);
              handleAction(`Alignment hints ${checked ? 'on' : 'off'}`);
            }}
            onAction={handleAction}
          />
        </div>
      </div>
    </article>
  );
}

function ContextMenuSurface({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="w-48 rounded-lg border border-border bg-popover p-1 shadow-xl">
      <MenuCommand
        icon={<BrushCleaning size={15} />}
        label="Tidy selected"
        flyout
        onSelect={() => onAction('Tidy selected')}
      />
      <MenuCommand
        icon={<AlignStartHorizontal size={15} />}
        label="Align"
        flyout
        onSelect={() => onAction('Align')}
      />
      <MenuCommand
        icon={<AlignHorizontalSpaceAround size={15} />}
        label="Distribute"
        flyout
        onSelect={() => onAction('Distribute')}
      />
      <div className="my-1 h-px bg-border" />
      <MenuCommand
        icon={<Copy size={15} />}
        label="Copy"
        shortcut="⌘C"
        onSelect={() => onAction('Copy')}
      />
      <MenuCommand
        icon={<Scissors size={15} />}
        label="Cut"
        shortcut="⌘X"
        onSelect={() => onAction('Cut')}
      />
      <MenuCommand
        icon={<Clipboard size={15} />}
        label="Paste"
        shortcut="⌘V"
        onSelect={() => onAction('Paste')}
      />
      <MenuCommand
        icon={<Layers size={15} />}
        label="Convert to subflow"
        onSelect={() => onAction('Convert to subflow')}
      />
      <div className="my-1 h-px bg-border" />
      <MenuCommand
        icon={<Trash2 size={15} />}
        label="Delete"
        shortcut="⌫"
        onSelect={() => onAction('Delete')}
      />
    </div>
  );
}

type WorkflowAccess = 'bottom-right' | 'hover' | 'right-click';

function WorkflowAccessExample({ access }: { access: WorkflowAccess }) {
  const contextual = access !== 'bottom-right';
  const workflowNodes = React.useMemo(
    () =>
      exampleNodes.map((node) => ({
        ...node,
        selected: contextual && node.id === 'review',
      })),
    [contextual]
  );
  const { canvasProps } = useCanvasStory({
    initialNodes: workflowNodes,
    initialEdges: exampleEdges,
  });
  const [lastAction, setLastAction] = React.useState('Menu open');

  const title =
    access === 'bottom-right'
      ? 'Bottom-right access'
      : access === 'hover'
        ? 'Node hover access'
        : 'Right-click access';
  const description =
    access === 'bottom-right'
      ? 'Open Tidy up from the persistent canvas control.'
      : access === 'hover'
        ? 'Hover over a node, then open More.'
        : 'Right-click a node to open the same contextual menu.';

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            Workflow experience
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <span className="hidden max-w-40 truncate rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:block">
          {lastAction}
        </span>
      </div>
      <div className="h-[300px] bg-background">
        <BaseCanvas {...canvasProps} mode="design">
          {access === 'bottom-right' ? (
            <Panel position="bottom-right">
              <div className="flex items-end gap-2">
                <div className="w-48 rounded-lg border border-border bg-popover p-1 shadow-xl">
                  <MenuFlyoutPanel
                    flyout="tidy"
                    hintsEnabled
                    canUndo={false}
                    onHintsChange={() => undefined}
                    onAction={setLastAction}
                  />
                </div>
                <CanvasZoomControls
                  tidyUpOptions={tidyUpOptions}
                  onTidyUpSelect={(id) => {
                    const option = tidyUpOptions.find((item) => item.id === id);
                    setLastAction(option?.label ?? id);
                  }}
                />
              </div>
            </Panel>
          ) : access === 'hover' ? (
            <Panel position="top-right">
              <div className="flex items-start gap-2">
                <div className="flex items-center rounded-lg border-2 border-primary bg-card p-1 pl-3 shadow-lg">
                  <span className="text-xs font-medium text-foreground">Review request</span>
                  <button
                    type="button"
                    className="ml-2 flex size-8 items-center justify-center rounded-md text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open node More menu"
                    onClick={() => setLastAction('Opened from node More')}
                  >
                    <Ellipsis size={17} />
                  </button>
                </div>
                <ContextMenuSurface onAction={setLastAction} />
              </div>
            </Panel>
          ) : (
            <Panel position="top-right">
              <div className="flex items-start gap-2">
                <div className="rounded-lg border border-dashed border-primary bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                  Right-click node
                </div>
                <ContextMenuSurface onAction={setLastAction} />
              </div>
            </Panel>
          )}
        </BaseCanvas>
      </div>
    </article>
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

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <div className="grid gap-5">
              <ScopeCard
                icon={<BrushCleaning size={19} />}
                eyebrow="Global"
                title="Bottom-right Tidy up"
                description="Use the persistent canvas control when a layout strategy should reorganize the workflow as a whole."
                affects="Entire workflow"
                availability="Always visible"
              />
              <MenuStateExample selected={false} />
              <WorkflowAccessExample access="bottom-right" />
            </div>
            <div className="grid gap-5">
              <ScopeCard
                icon={<Ellipsis size={20} />}
                eyebrow="Contextual"
                title="Hover-menu Tidy up"
                description="Use the node overflow when the action is limited to the current node, selection, branch, or group."
                affects="Current context"
                availability="On hover or selection"
              />
              <MenuStateExample selected />
              <WorkflowAccessExample access="hover" />
              <WorkflowAccessExample access="right-click" />
            </div>
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
              strategy="Align subtly"
              useWhen="The workflow is already understandable but spacing feels uneven."
              result="Nudge nodes onto a shared rhythm while preserving the overall shape."
            />
            <GuidanceRow
              strategy="Make compact"
              useWhen="The graph has grown organically and needs a clearer reading order."
              result="Reflow the workflow and reduce unnecessary space."
            />
            <GuidanceRow
              strategy="Lay out horizontally"
              useWhen="The process should read from left to right."
              result="Reflow nodes horizontally and keep handles on the left and right."
            />
            <GuidanceRow
              strategy="Lay out vertically"
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
      </div>
    </main>
  );
}
