import { cn } from '@uipath/apollo-wind';
import { ArrowUpRight, LayoutPanelTop, PanelRight, PanelsTopLeft } from 'lucide-react';
import type { ReactNode } from 'react';

// ============================================================================
// Links
// ============================================================================

/**
 * Storybook keeps globals (theme, locale) in the URL only, and these cards do a
 * full top-frame navigation, so rebuild the target URL from the current
 * top-frame query string and swap only `path`. The href stays relative to the
 * iframe directory so deployments served under a subpath keep working.
 */
const buildStoryHref = (storyId: string) => {
  let extra = '';
  try {
    const params = new URLSearchParams(window.top?.location.search ?? '');
    params.delete('path');
    extra = params.toString();
  } catch {
    // Top frame is cross-origin; fall back to a bare path.
  }
  return `./?path=/story/${storyId}${extra ? `&${extra}` : ''}`;
};

// ============================================================================
// Wireframe primitives
// ============================================================================

type Region = 'sidebar' | 'canvas' | 'right' | 'bottom' | 'takeover' | 'input' | 'output';

function Bar({ className, on }: { className?: string; on?: boolean }) {
  return (
    <div
      className={cn(
        'h-1.5 shrink-0 rounded-full',
        on ? 'bg-brand/45' : 'bg-foreground-subtle/25',
        className
      )}
    />
  );
}

function Box({ className, on }: { className?: string; on?: boolean }) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-[3px]',
        on ? 'bg-brand/20' : 'bg-foreground-subtle/15',
        className
      )}
    />
  );
}

/** Rounded region. Highlighted regions get the brand outline and fill. */
function Zone({
  on,
  className,
  children,
}: {
  on?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border',
        on
          ? 'border-brand bg-brand-subtle ring-1 ring-brand/30'
          : 'border-border-subtle bg-surface-raised',
        className
      )}
    >
      {children}
    </div>
  );
}

function CanvasGraph() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(var(--color-foreground-subtle)_0.5px,transparent_0.5px)] bg-size-[8px_8px] opacity-40">
      <div className="absolute left-[18%] top-[38%] flex items-center">
        <Box className="h-4 w-7 border border-border-subtle bg-surface" />
        <div className="h-px w-4 bg-foreground-subtle/60" />
        <Box className="h-4 w-7 border border-brand bg-surface" />
        <div className="h-px w-4 bg-foreground-subtle/60" />
        <Box className="h-4 w-7 border border-border-subtle bg-surface" />
      </div>
    </div>
  );
}

function CanvasZone({ on, className }: { on?: boolean; className?: string }) {
  return (
    <Zone on={on} className={cn('relative min-w-0 flex-1', className)}>
      <CanvasGraph />
      <div className="absolute right-1.5 top-1.5 flex gap-1">
        <Box className="h-2.5 w-8 bg-surface" />
        <Box className="size-2.5 bg-surface" />
      </div>
    </Zone>
  );
}

function SidebarRail({ on }: { on?: boolean }) {
  return (
    <Zone on={on} className="flex w-6 flex-col items-center gap-1.5 py-1.5">
      <Box on={on} className="size-2.5 bg-brand/70" />
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} on={on} className="size-2.5" />
      ))}
      <div className="flex-1" />
      <Box on={on} className="size-2.5" />
    </Zone>
  );
}

function SidebarExpanded({ on }: { on?: boolean }) {
  return (
    <Zone on={on} className="flex w-[26%] flex-col gap-1.5 p-1.5">
      <Bar on={on} className="w-3/5" />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn('flex items-center gap-1 rounded-sm p-0.5', i === 0 && 'bg-brand/15')}
        >
          <Box on={on} className={cn('size-2', i === 0 && 'bg-brand/70')} />
          <Bar on={on} className={i % 2 ? 'w-2/5' : 'w-3/5'} />
        </div>
      ))}
    </Zone>
  );
}

function FieldStack({ on, count = 3 }: { on?: boolean; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <Bar on={on} className="h-1 w-2/5" />
          <Box on={on} className="h-2.5 w-full" />
        </div>
      ))}
    </>
  );
}

function PanelBody({ on, children }: { on?: boolean; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-1.5 p-1.5">
      <div className="flex items-center justify-between">
        <Bar on={on} className="w-2/5" />
        <Box on={on} className="size-2" />
      </div>
      {children ?? <FieldStack on={on} />}
    </div>
  );
}

function BottomPanel({ on, collapsed }: { on?: boolean; collapsed?: boolean }) {
  return (
    <Zone on={on} className={cn('absolute inset-x-1.5 bottom-1.5', collapsed ? 'h-4' : 'h-[34%]')}>
      <div className="flex items-center gap-1 p-1">
        <Box on={on} className="h-2 w-7 bg-brand/40" />
        <Box on={on} className="h-2 w-6" />
        <Box on={on} className="h-2 w-6" />
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-1 px-1.5">
          <Bar on={on} className="w-3/4" />
          <Bar on={on} className="w-1/2" />
        </div>
      )}
    </Zone>
  );
}

// ============================================================================
// Shells
// ============================================================================

type StandaloneShellProps = {
  sidebar?: 'rail' | 'expanded';
  right?: boolean;
  bottom?: 'executions' | 'collapsed' | 'properties';
  takeover?: boolean;
  highlight: Region[];
  /** Replaces the right panel body, used by the content-type previews. */
  rightContent?: ReactNode;
};

function StandaloneShell({
  sidebar,
  right,
  bottom,
  takeover,
  highlight,
  rightContent,
}: StandaloneShellProps) {
  const on = (region: Region) => highlight.includes(region);
  return (
    <div className="relative flex aspect-[16/10] gap-1.5 bg-surface p-1.5">
      {sidebar === 'rail' && <SidebarRail on={on('sidebar')} />}
      {sidebar === 'expanded' && <SidebarExpanded on={on('sidebar')} />}
      <div className="relative min-w-0 flex-1">
        <CanvasZone on={on('canvas')} className="absolute inset-0" />
        {right && (
          <Zone
            on={on('right')}
            className={cn(
              'absolute right-1.5 top-1.5 shadow-sm',
              bottom === 'executions' || bottom === 'collapsed' ? 'bottom-7' : 'bottom-1.5',
              rightContent ? 'w-[46%]' : 'w-[34%]'
            )}
          >
            {rightContent ?? <PanelBody on={on('right')} />}
          </Zone>
        )}
        {bottom === 'properties' && (
          <Zone on={on('bottom')} className="absolute inset-x-1.5 bottom-1.5 h-[40%]">
            <div className="grid h-full grid-cols-3 gap-1.5 p-1.5">
              <FieldStack on={on('bottom')} count={2} />
              <FieldStack on={on('bottom')} count={2} />
              <FieldStack on={on('bottom')} count={2} />
            </div>
          </Zone>
        )}
        {(bottom === 'executions' || bottom === 'collapsed') && (
          <div className={cn('absolute inset-0', right && 'right-[36%]')}>
            <BottomPanel on={on('bottom')} collapsed={bottom === 'collapsed'} />
          </div>
        )}
      </div>
      {takeover && (
        <div className="absolute inset-0 grid place-items-center bg-foreground/15 p-3">
          <Zone on={on('takeover')} className="flex size-full flex-col shadow-lg">
            <div className="flex items-center justify-between border-b border-brand/30 p-1.5">
              <Bar on className="w-1/4" />
              <Box className="h-2.5 w-8 bg-brand/60" />
            </div>
            <div className="flex min-h-0 flex-1">
              <div className="flex w-1/4 flex-col gap-1.5 border-r border-brand/30 p-1.5">
                <Bar on className="w-3/4" />
                <Bar on className="w-1/2" />
                <Bar on className="w-2/3" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                <FieldStack on count={2} />
              </div>
            </div>
          </Zone>
        </div>
      )}
    </div>
  );
}

type DockPanelId = 'input' | 'properties' | 'output';

/** Dockview host: square splits and tab strips instead of floating panels. */
function DockShell({ panels, highlight }: { panels: DockPanelId[]; highlight: Region[] }) {
  const on = (region: Region) => highlight.includes(region);
  const tabbed = (label: ReactNode, isOn: boolean, body: ReactNode, className?: string) => (
    <div
      className={cn(
        'flex min-w-0 flex-col border',
        isOn ? 'border-brand bg-brand-subtle' : 'border-border-subtle bg-surface-raised',
        className
      )}
    >
      <div
        className={cn(
          'flex h-3.5 shrink-0 items-end gap-0.5 border-b px-0.5',
          isOn ? 'border-brand/40 bg-brand/10' : 'border-border-subtle bg-surface'
        )}
      >
        <div
          className={cn(
            'flex h-2.5 items-center rounded-t-[2px] border-t-2 px-1',
            isOn ? 'border-brand bg-brand-subtle' : 'border-foreground-subtle/40 bg-surface-raised'
          )}
        >
          {label}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{body}</div>
    </div>
  );
  const hasInput = panels.includes('input');
  const hasProperties = panels.includes('properties');
  const hasOutput = panels.includes('output');
  const multi = panels.length > 1;

  return (
    <div className="flex aspect-[16/10] flex-col bg-surface">
      <div className="flex h-3 shrink-0 items-center gap-1 border-b border-border-subtle px-1.5">
        <Box className="size-1.5 rounded-full" />
        <Box className="size-1.5 rounded-full" />
        <Bar className="h-1 w-10" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-5 shrink-0 flex-col items-center gap-1.5 border-r border-border-subtle py-1.5">
          <Box className="size-2 bg-brand/60" />
          <Box className="size-2" />
          <Box className="size-2" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            {tabbed(
              <Bar on={on('canvas')} className="h-1 w-5" />,
              on('canvas'),
              <CanvasGraph />,
              'flex-1'
            )}
            {hasInput &&
              !multi &&
              tabbed(
                <Bar on className="h-1 w-4" />,
                on('input'),
                <PanelBody on={on('input')} />,
                'w-[34%]'
              )}
            {hasProperties &&
              tabbed(
                <Bar on={on('right')} className="h-1 w-6" />,
                on('right'),
                <PanelBody on={on('right')} />,
                'w-[34%]'
              )}
            {hasOutput &&
              !multi &&
              tabbed(
                <Bar on className="h-1 w-5" />,
                on('output'),
                <PanelBody on={on('output')} />,
                'w-[34%]'
              )}
          </div>
          {multi && (
            <div className="flex h-[36%] shrink-0">
              {hasInput &&
                tabbed(
                  <Bar on className="h-1 w-4" />,
                  on('input'),
                  <div className="flex flex-col gap-1 p-1.5">
                    <Bar on className="w-3/4" />
                    <Bar on className="w-1/2" />
                  </div>,
                  'flex-1'
                )}
              {hasOutput &&
                tabbed(
                  <Bar on className="h-1 w-5" />,
                  on('output'),
                  <div className="flex flex-col gap-1 p-1.5">
                    <Bar on className="w-2/3" />
                    <Bar on className="w-1/3" />
                  </div>,
                  'flex-1'
                )}
            </div>
          )}
        </div>
      </div>
      <div className="h-2 shrink-0 bg-brand/70" />
    </div>
  );
}

// ============================================================================
// Right panel content bodies
// ============================================================================

function Tabs3({ active = 0 }: { active?: number }) {
  return (
    <div className="flex gap-1 rounded-sm bg-brand/10 p-0.5">
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          className={cn('h-2 flex-1', i === active ? 'bg-brand/35' : 'bg-transparent')}
        />
      ))}
    </div>
  );
}

function TokenInput({ error }: { error?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-3 items-center gap-1 rounded-[3px] border px-0.5',
        error ? 'border-error bg-error-background' : 'border-brand/40 bg-brand/5'
      )}
    >
      <div className="h-1.5 w-7 rounded-full bg-brand/60" />
      <Bar on className="h-1 w-1/3" />
    </div>
  );
}

type ContentVariant =
  | 'properties'
  | 'forms'
  | 'rules'
  | 'variables'
  | 'node'
  | 'dap'
  | 'dap-validation'
  | 'field-help';

const contentBodies: Record<ContentVariant, ReactNode> = {
  properties: (
    <PanelBody on>
      <Tabs3 />
      <FieldStack on count={3} />
    </PanelBody>
  ),
  forms: (
    <PanelBody on>
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-1 rounded-sm border border-brand/30 p-1">
          <div className="flex items-center justify-between">
            <Bar on className="w-1/2" />
            <div className="size-1.5 rotate-45 border-b border-r border-brand" />
          </div>
          <FieldStack on count={section === 0 ? 2 : 1} />
        </div>
      ))}
      <div className="flex items-center gap-1">
        <Box className="size-2 border border-brand bg-surface" />
        <Bar on className="w-1/2" />
      </div>
    </PanelBody>
  ),
  rules: (
    <PanelBody on>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-1">
          {row > 0 && <Box className="h-1.5 w-4 bg-brand/50" />}
          <div className="flex gap-0.5">
            <Box on className="h-2.5 flex-1" />
            <Box on className="h-2.5 w-4" />
            <Box on className="h-2.5 flex-1" />
          </div>
        </div>
      ))}
      <div className="h-2.5 rounded-[3px] border border-dashed border-brand/60" />
    </PanelBody>
  ),
  variables: (
    <PanelBody on>
      <Tabs3 active={1} />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center justify-between gap-1">
          <Bar on className={row % 2 ? 'w-2/5' : 'w-1/2'} />
          <Box className="h-2 w-5 rounded-full bg-brand/30" />
        </div>
      ))}
    </PanelBody>
  ),
  node: (
    <PanelBody on>
      <div className="flex items-center gap-1">
        <Box className="size-3 bg-brand/60" />
        <Bar on className="w-1/3" />
        <div className="flex-1" />
        <Box className="size-2 border border-brand bg-surface" />
      </div>
      <Tabs3 />
      <FieldStack on count={2} />
    </PanelBody>
  ),
  dap: (
    <PanelBody on>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-2/5" />
        <TokenInput />
      </div>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-1/3" />
        <div className="rounded-[3px] border border-brand/40 bg-brand/5">
          <div className="flex gap-0.5 border-b border-brand/20 p-0.5">
            <Box on className="size-1.5" />
            <Box on className="size-1.5" />
            <Box on className="size-1.5" />
          </div>
          <div className="flex flex-col gap-0.5 p-0.5">
            <Bar on className="h-1 w-3/4" />
            <div className="h-1.5 w-8 rounded-full bg-brand/60" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-2/5" />
        <TokenInput />
      </div>
    </PanelBody>
  ),
  'dap-validation': (
    <PanelBody on>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-2/5" />
        <TokenInput />
      </div>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-1/3" />
        <TokenInput error />
        <div className="h-1 w-3/5 rounded-full bg-error/70" />
      </div>
      <div className="flex flex-col gap-0.5">
        <Bar on className="h-1 w-2/5" />
        <TokenInput error />
        <div className="h-1 w-1/2 rounded-full bg-error/70" />
      </div>
    </PanelBody>
  ),
  'field-help': (
    <PanelBody on>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5">
            <Bar on className="h-1 w-2/5" />
            <div className="size-1.5 rounded-full border border-brand" />
          </div>
          <Box on className="h-2.5 w-full" />
          <Bar className="h-1 w-4/5 bg-foreground-subtle/30" />
        </div>
      ))}
    </PanelBody>
  ),
};

// ============================================================================
// Catalog
// ============================================================================

type Preview = {
  name: string;
  description: string;
  regions: string[];
  storyId?: string;
  preview: ReactNode;
};

const standalonePreviews: Preview[] = [
  {
    name: 'Canvas Only',
    description: 'The canvas with no panels open. Start here for read-only or embedded flows.',
    regions: ['Canvas'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--canvas-only',
    preview: <StandaloneShell highlight={['canvas']} />,
  },
  {
    name: 'Panel Right',
    description: 'A floating properties panel opens beside the canvas when a node is selected.',
    regions: ['Canvas', 'Right panel'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--with-right-properties-panel',
    preview: <StandaloneShell right highlight={['right']} />,
  },
  {
    name: 'Panel Bottom',
    description: 'Properties dock along the bottom edge, keeping the full canvas width visible.',
    regions: ['Canvas', 'Bottom panel'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--with-bottom-properties-panel',
    preview: <StandaloneShell bottom="properties" highlight={['bottom']} />,
  },
  {
    name: 'Bottom Executions',
    description: 'A resizable tabbed panel for executions, datasets, evaluators, and eval runs.',
    regions: ['Canvas', 'Bottom panel'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--with-bottom-panel',
    preview: <StandaloneShell bottom="executions" highlight={['bottom']} />,
  },
  {
    name: 'Sidebar Left',
    description: 'A collapsible sidebar for variables, files, connections, and run history.',
    regions: ['Sidebar', 'Canvas'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--with-left-sidebar',
    preview: <StandaloneShell sidebar="expanded" highlight={['sidebar']} />,
  },
  {
    name: 'Modal Takeover',
    description: 'A full-surface modal for focused tasks such as testing or deep configuration.',
    regions: ['Sidebar', 'Canvas', 'Right panel', 'Takeover'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--with-takeover-modal',
    preview: <StandaloneShell sidebar="rail" right takeover highlight={['takeover']} />,
  },
  {
    name: 'Workbench',
    description:
      'The full composition: sidebar rail, canvas, right panel, and a collapsible bottom panel.',
    regions: ['Sidebar', 'Canvas', 'Right panel', 'Bottom panel'],
    storyId: 'apollo-react-canvas-templates-flow-standalone--full-workbench',
    preview: (
      <StandaloneShell
        sidebar="rail"
        right
        bottom="collapsed"
        highlight={['sidebar', 'right', 'bottom']}
      />
    ),
  },
];

const vsCodePreviews: Preview[] = [
  {
    name: 'Canvas Only',
    description: 'The canvas as a single Dockview tab. The host owns the surrounding chrome.',
    regions: ['Canvas'],
    storyId: 'apollo-react-canvas-templates-flow-vs-code--canvas-only',
    preview: <DockShell panels={[]} highlight={['canvas']} />,
  },
  {
    name: 'Right Panel',
    description: 'Properties mount in a docked split that users can drag, tab, or resize.',
    regions: ['Canvas', 'Properties'],
    storyId: 'apollo-react-canvas-templates-flow-vs-code--with-right-panel',
    preview: <DockShell panels={['properties']} highlight={['right']} />,
  },
  {
    name: 'Input Panel',
    description: 'Shows the node input data next to the canvas in its own docked split.',
    regions: ['Canvas', 'Input'],
    storyId: 'apollo-react-canvas-templates-flow-vs-code--with-input-panel',
    preview: <DockShell panels={['input']} highlight={['input']} />,
  },
  {
    name: 'Output Panel',
    description: 'Shows the node output data next to the canvas in its own docked split.',
    regions: ['Canvas', 'Output'],
    storyId: 'apollo-react-canvas-templates-flow-vs-code--with-output-panel',
    preview: <DockShell panels={['output']} highlight={['output']} />,
  },
  {
    name: 'Multi Panel',
    description: 'Input, properties, and output open together. The host persists the arrangement.',
    regions: ['Canvas', 'Input', 'Properties', 'Output'],
    storyId: 'apollo-react-canvas-templates-flow-vs-code--multi-panel',
    preview: (
      <DockShell
        panels={['input', 'properties', 'output']}
        highlight={['input', 'right', 'output']}
      />
    ),
  },
];

const contentPreviews: (Omit<Preview, 'preview'> & { variant: ContentVariant })[] = [
  {
    name: 'Properties',
    description:
      'The default node panel: tabbed parameters, error handling, and advanced settings.',
    regions: ['Tabs', 'Fields'],
    variant: 'properties',
    storyId: 'apollo-react-canvas-templates-flow-standalone--full-workbench',
  },
  {
    name: 'Quick Form',
    description: 'Schema-driven form sections for configuring a node without leaving the canvas.',
    regions: ['Sections', 'Fields'],
    variant: 'forms',
  },
  {
    name: 'Rule Building',
    description: 'Condition rows joined by AND or OR, with a clear way to add another rule.',
    regions: ['Conditions', 'Operators'],
    variant: 'rules',
  },
  {
    name: 'Variables',
    description: 'Inputs, outputs, and workflow variables for a node. Expands into a takeover.',
    regions: ['Tabs', 'Variable list', 'Takeover'],
    variant: 'variables',
  },
  {
    name: 'Node',
    description: 'A node-specific panel, such as Send Email, that can open a full takeover editor.',
    regions: ['Header', 'Tabs', 'Takeover'],
    variant: 'node',
  },
  {
    name: 'DAP',
    description: 'React DAP fields with variable tokens and a rich text body editor.',
    regions: ['Fields', 'Variable tokens', 'Rich text'],
    variant: 'dap',
    storyId: 'apollo-wind-patterns-layout-patterns--dap-send-email',
  },
  {
    name: 'DAP Validation',
    description: 'The DAP panel with validation triggered, showing inline field errors.',
    regions: ['Fields', 'Errors'],
    variant: 'dap-validation',
    storyId: 'apollo-wind-forms-guidance-field-validation--example',
  },
  {
    name: 'Field Help',
    description: 'Fields with help icons and helper text that explain what each value does.',
    regions: ['Fields', 'Help text'],
    variant: 'field-help',
    storyId: 'apollo-wind-forms-guidance-field-help--example',
  },
];

// ============================================================================
// Page
// ============================================================================

function PreviewCard({ name, description, regions, storyId, preview }: Preview) {
  const Wrapper = storyId ? 'a' : 'div';
  return (
    <Wrapper
      href={storyId ? buildStoryHref(storyId) : undefined}
      target={storyId ? '_top' : undefined}
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-raised transition-all',
        storyId &&
          'hover:border-brand/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'
      )}
    >
      <div className="border-b border-border-subtle bg-surface-overlay p-3">
        <div className="overflow-hidden rounded-lg border border-border-subtle shadow-sm">
          {preview}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{name}</h3>
          {storyId ? (
            <ArrowUpRight className="size-4 shrink-0 text-foreground-subtle transition-colors group-hover:text-brand" />
          ) : (
            <span className="shrink-0 rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-medium text-foreground-subtle">
              No live story yet
            </span>
          )}
        </div>
        <p className="text-xs leading-5 text-foreground-muted">{description}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {regions.map((region) => (
            <span
              key={region}
              className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] text-foreground-muted"
            >
              {region}
            </span>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  body,
  children,
}: {
  icon: typeof LayoutPanelTop;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-overlay text-brand">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-subtle">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">{body}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function LayoutPreviewsPage() {
  return (
    <main className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            Canvas templates
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Flow layout previews
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
            Every layout the Flow Workbench composes, at a glance. The highlighted region is what
            each layout adds. Select a card to open the live story.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm border border-brand bg-brand-subtle" />
              Region this layout adds
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm border border-border-subtle bg-surface-raised" />
              Shared shell
            </span>
          </div>
        </header>

        <Section
          icon={LayoutPanelTop}
          eyebrow="Standalone"
          title="Apollo owns the composition"
          body="Panels float within the canvas and keep Apollo spacing and radius. Use these when the canvas is the primary product surface."
        >
          {standalonePreviews.map((item) => (
            <PreviewCard key={item.name} {...item} />
          ))}
        </Section>

        <Section
          icon={PanelsTopLeft}
          eyebrow="VS Code"
          title="The workbench owns the composition"
          body="Dockview owns tabs, splits, drop targets, and resizing. Apollo supplies the same panel content that Standalone uses."
        >
          {vsCodePreviews.map((item) => (
            <PreviewCard key={item.name} {...item} />
          ))}
        </Section>

        <Section
          icon={PanelRight}
          eyebrow="Right panel content"
          title="What fills the right panel"
          body="The Workbench right panel accepts different content types. The shell stays the same, only the panel body changes."
        >
          {contentPreviews.map(({ variant, ...item }) => (
            <PreviewCard
              key={item.name}
              {...item}
              preview={
                <StandaloneShell
                  sidebar="rail"
                  right
                  highlight={['right']}
                  rightContent={contentBodies[variant]}
                />
              }
            />
          ))}
        </Section>
      </div>
    </main>
  );
}
