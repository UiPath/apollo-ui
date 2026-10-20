import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, ChevronRight, CircleCheck, CircleX, Clock, Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import {
  buildJsonTree,
  collectContainerPaths,
  type JsonContainer,
  type JsonTreeNode,
  JsonTreeView,
  type JsonTreeViewStrings,
} from './json-tree-view';

export type ToolCallStatus = 'pending' | 'executing' | 'completed' | 'failed';

export interface ToolCallStrings {
  // Status names, read to screen readers ahead of the status line.
  pending: string;
  executing: string;
  completed: string;
  failed: string;
  /** Status line while the call is pending or executing. */
  running: (name: string) => string;
  /** Status line once the call has finished. `duration` is pre-formatted, e.g. "1.23 seconds". */
  ran: (name: string, duration?: string) => string;
  input: string;
  output: string;
  errors: string;
}

export const DEFAULT_TOOL_CALL_STRINGS: ToolCallStrings = {
  pending: 'Pending',
  executing: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  running: (name) => `Running '${name}'`,
  ran: (name, duration) => (duration ? `Ran '${name}' for ${duration}` : `Ran '${name}'`),
  input: 'Input',
  output: 'Output',
  errors: 'Errors',
};

interface ToolCallContextValue {
  status: ToolCallStatus;
  strings: ToolCallStrings;
  jsonTreeStrings?: Partial<JsonTreeViewStrings>;
  hasContent: boolean;
  registerContent: () => () => void;
}

const ToolCallContext = React.createContext<ToolCallContextValue | null>(null);

function useToolCallContext(component: string): ToolCallContextValue {
  const context = React.useContext(ToolCallContext);
  if (!context) throw new Error(`${component} must be used within a ToolCall`);
  return context;
}

/** An `undefined` override (e.g. a missing translation) keeps the English default. */
function mergeStrings(overrides: Partial<ToolCallStrings> | undefined): ToolCallStrings {
  const merged = { ...DEFAULT_TOOL_CALL_STRINGS };
  if (!overrides) return merged;
  for (const key of Object.keys(overrides) as (keyof ToolCallStrings)[]) {
    const value = overrides[key];
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const TOGGLE_CLASSES =
  'flex w-full min-w-0 items-center gap-2 rounded p-1 text-left transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none';

const toolCallVariants = cva('group/tool-call flex w-full min-w-0 flex-col text-muted-foreground', {
  variants: {
    size: {
      sm: 'p-2 text-xs',
      md: 'p-3 text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface ToolCallProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toolCallVariants> {
  status: ToolCallStatus;
  /** Controlled open state of the body. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ToolCallStrings>;
  /** Overrides for the JSON tree's strings, merged over any outer `JsonTreeViewProvider`. */
  jsonTreeStrings?: Partial<JsonTreeViewStrings>;
}

/**
 * One agent tool call, laid out like the Material ApToolCall: a status line ("Ran 'x' for 1.2
 * seconds") that toggles an indented body of collapsible sections (input, errors, output, or any
 * `ToolCallSection`). The body is not rendered while closed. Omit `ToolCallContent` for a
 * name-only line (the toggle hides itself).
 */
const ToolCall = React.forwardRef<HTMLDivElement, ToolCallProps>(
  (
    {
      className,
      status,
      size = 'md',
      open,
      defaultOpen,
      onOpenChange,
      strings,
      jsonTreeStrings,
      ...props
    },
    ref
  ) => {
    const [contentCount, setContentCount] = React.useState(0);

    const registerContent = React.useCallback(() => {
      setContentCount((count) => count + 1);
      return () => setContentCount((count) => count - 1);
    }, []);

    const context = React.useMemo<ToolCallContextValue>(
      () => ({
        status,
        strings: mergeStrings(strings),
        jsonTreeStrings,
        hasContent: contentCount > 0,
        registerContent,
      }),
      [status, strings, jsonTreeStrings, contentCount, registerContent]
    );

    return (
      <ToolCallContext.Provider value={context}>
        <Collapsible asChild open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
          <div
            ref={ref}
            data-slot="tool-call"
            data-status={status}
            data-size={size}
            className={cn(toolCallVariants({ size }), className)}
            {...props}
          />
        </Collapsible>
      </ToolCallContext.Provider>
    );
  }
);
ToolCall.displayName = 'ToolCall';

const STATUS_ICONS: Record<ToolCallStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  executing: Loader2,
  completed: CircleCheck,
  failed: CircleX,
};

const toolCallStatusIconVariants = cva('size-5 shrink-0 group-data-[size=sm]/tool-call:size-4', {
  variants: {
    status: {
      pending: 'text-muted-foreground',
      executing: 'animate-spin text-primary motion-reduce:animate-none',
      completed: 'text-success',
      failed: 'text-destructive',
    },
  },
});

export interface ToolCallHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Tool name, as it should read inside the status line. */
  name: string;
  /** Pre-formatted elapsed time, e.g. "1.23 seconds". Shown once the call has finished. */
  duration?: string;
}

const ToolCallHeader = React.forwardRef<HTMLDivElement, ToolCallHeaderProps>(
  ({ className, name, duration, ...props }, ref) => {
    const { status, strings, hasContent } = useToolCallContext('ToolCallHeader');
    const StatusIcon = STATUS_ICONS[status];
    const finished = status === 'completed' || status === 'failed';

    const line = (
      <>
        <StatusIcon
          data-slot="tool-call-status-icon"
          aria-hidden="true"
          className={toolCallStatusIconVariants({ status })}
        />
        {/* The line reads the same for completed and failed, so the status is spoken too. */}
        <span data-slot="tool-call-status" className="sr-only">
          {strings[status]}
        </span>{' '}
        <span data-slot="tool-call-label" className="min-w-0 wrap-break-word">
          {finished ? strings.ran(name, duration) : strings.running(name)}
        </span>
      </>
    );

    return (
      <div
        ref={ref}
        data-slot="tool-call-header"
        className={cn('flex min-w-0', className)}
        {...props}
      >
        {hasContent ? (
          <CollapsibleTrigger
            data-slot="tool-call-toggle"
            className={cn('group/tool-call-toggle', TOGGLE_CLASSES)}
          >
            {line}
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform motion-reduce:transition-none group-data-[state=open]/tool-call-toggle:rotate-180"
            />
          </CollapsibleTrigger>
        ) : (
          <div className="flex min-w-0 items-center gap-2 p-1">{line}</div>
        )}
      </div>
    );
  }
);
ToolCallHeader.displayName = 'ToolCallHeader';

export type ToolCallContentProps = React.ComponentPropsWithoutRef<typeof CollapsibleContent>;

const ToolCallContent = React.forwardRef<HTMLDivElement, ToolCallContentProps>(
  ({ className, ...props }, ref) => {
    const { registerContent } = useToolCallContext('ToolCallContent');
    // Registers while mounted, even when closed, so the header knows to render its toggle.
    useIsomorphicLayoutEffect(() => registerContent(), [registerContent]);

    return (
      <CollapsibleContent
        ref={ref}
        data-slot="tool-call-content"
        className={cn(
          'mt-2 ml-3 flex min-w-0 flex-col border-l pl-3 group-data-[size=sm]/tool-call:ml-2 group-data-[size=sm]/tool-call:pl-2',
          className
        )}
        {...props}
      />
    );
  }
);
ToolCallContent.displayName = 'ToolCallContent';

export interface ToolCallSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Sections start closed, like ApToolCall's. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** A collapsible section of the body, for input/output/errors or custom ones such as traces. */
const ToolCallSection = React.forwardRef<HTMLDivElement, ToolCallSectionProps>(
  ({ className, title, open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    useToolCallContext('ToolCallSection');
    return (
      <Collapsible asChild open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <div
          ref={ref}
          data-slot="tool-call-section"
          className={cn('flex min-w-0 flex-col', className)}
          {...props}
        >
          <CollapsibleTrigger
            data-slot="tool-call-section-toggle"
            className={cn('group/tool-call-section-toggle', TOGGLE_CLASSES)}
          >
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform motion-reduce:transition-none group-data-[state=open]/tool-call-section-toggle:rotate-90"
            />
            {title}
          </CollapsibleTrigger>
          <CollapsibleContent data-slot="tool-call-section-content" className="ml-7 min-w-0">
            {children}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }
);
ToolCallSection.displayName = 'ToolCallSection';

/** Returns a node to replace the default rendering, or `undefined` to keep it. */
export type ToolCallRenderValue = (value: unknown) => React.ReactNode | undefined;

export interface ToolCallValueProps extends Omit<ToolCallSectionProps, 'title' | 'children'> {
  /**
   * Arrays and plain objects render as a read-only JSON tree with nested values folded; anything
   * else as text. `undefined` and `null` hide the section, as ApToolCall hides empty data.
   */
  value: unknown;
  /** Custom renderer, e.g. a syntax-highlighted code block. */
  renderValue?: ToolCallRenderValue;
}

// Class instances such as Error or Date have no enumerable fields to show, so they render as text.
function isJsonContainer(value: unknown): value is JsonContainer {
  if (Array.isArray(value)) return true;
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Above this many nodes the tree mounts only the rows in view. */
const VIRTUALIZE_NODE_COUNT = 200;

function countNodes(nodes: JsonTreeNode[]): number {
  let count = 0;
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop() as JsonTreeNode;
    count += 1;
    if (node.children) stack.push(...node.children);
  }
  return count;
}

function ToolCallJsonValue({ value }: { value: JsonContainer }) {
  const { jsonTreeStrings } = useToolCallContext('ToolCallJsonValue');
  const nodes = React.useMemo(() => buildJsonTree({ value }), [value]);
  // Tracks opened paths rather than closed ones, so containers that stream in later start folded too.
  const [opened, setOpened] = React.useState<Record<string, boolean>>({});
  const collapsed = React.useMemo(
    () => Object.fromEntries(collectContainerPaths(nodes).map(({ path }) => [path, !opened[path]])),
    [nodes, opened]
  );
  const toggle = React.useCallback(
    (path: string) => setOpened((prev) => ({ ...prev, [path]: !prev[path] })),
    []
  );
  const virtualized = React.useMemo(() => countNodes(nodes) > VIRTUALIZE_NODE_COUNT, [nodes]);
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setScrollElement}
      data-slot="tool-call-value"
      className="my-2 max-h-80 overflow-auto rounded-md border bg-background"
    >
      <JsonTreeView
        nodes={nodes}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        readOnly
        strings={jsonTreeStrings}
        virtualized={virtualized}
        scrollElement={virtualized ? scrollElement : undefined}
      />
    </div>
  );
}

function ToolCallTextValue({ value }: { value: unknown }) {
  return (
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need focus to scroll a long payload
      tabIndex={0}
      data-slot="tool-call-value"
      className="my-2 max-h-45 overflow-y-auto rounded bg-muted px-3 py-2 text-xs wrap-break-word whitespace-pre-wrap outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      {String(value)}
    </div>
  );
}

// Rendered inside the section's content, so renderValue only runs while the section is open.
function ToolCallValue({
  value,
  renderValue,
}: {
  value: unknown;
  renderValue?: ToolCallRenderValue;
}) {
  const custom = renderValue?.(value);
  if (custom !== undefined) return <>{custom}</>;
  if (!isJsonContainer(value)) return <ToolCallTextValue value={value} />;
  // An empty tree would say "No fields to display."; the literal is clearer, as in ApToolCall.
  if (Object.keys(value).length === 0) {
    return <ToolCallTextValue value={Array.isArray(value) ? '[]' : '{}'} />;
  }
  return <ToolCallJsonValue value={value} />;
}

function createValueSection(
  slot: 'input' | 'output' | 'error',
  titleKey: 'input' | 'output' | 'errors',
  displayName: string
) {
  const Section = React.forwardRef<HTMLDivElement, ToolCallValueProps>(
    ({ value, renderValue, ...props }, ref) => {
      const { strings } = useToolCallContext(displayName);
      if (value === undefined || value === null) return null;

      return (
        <ToolCallSection
          ref={ref}
          data-slot={`tool-call-${slot}`}
          title={strings[titleKey]}
          {...props}
        >
          <ToolCallValue value={value} renderValue={renderValue} />
        </ToolCallSection>
      );
    }
  );
  Section.displayName = displayName;
  return Section;
}

const ToolCallInput = createValueSection('input', 'input', 'ToolCallInput');
const ToolCallOutput = createValueSection('output', 'output', 'ToolCallOutput');
const ToolCallError = createValueSection('error', 'errors', 'ToolCallError');

export {
  ToolCall,
  ToolCallHeader,
  ToolCallContent,
  ToolCallSection,
  ToolCallInput,
  ToolCallOutput,
  ToolCallError,
  toolCallVariants,
};
