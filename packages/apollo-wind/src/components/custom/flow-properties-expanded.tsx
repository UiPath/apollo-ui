import {
  Bot,
  Columns2,
  GripVertical,
  PanelRightOpen,
  Play,
  Rows2,
  TableProperties,
  Variable,
  X,
} from 'lucide-react';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface PropertiesExpandedProps {
  className?: string;
  /** Node name shown in the header */
  nodeName?: string;
  /** Node type label (e.g. "AI Agent") */
  nodeType?: string;
  /** Active top tab: 'properties' | 'variables' */
  activeTab?: 'properties' | 'variables';
  /** Callback when close button is clicked */
  onClose?: () => void;
}

// ============================================================================
// Internal: Mini tab (small pill tabs for Code/Input/Output sub-sections)
// ============================================================================

function MiniTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'flex h-6 items-center rounded-lg px-2 text-xs font-medium leading-5',
        active ? 'bg-surface text-foreground' : 'text-foreground-subtle'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Internal: Section header with grip icon and title
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl">
        <GripVertical className="h-5 w-5 text-foreground-subtle" />
      </div>
      <span className="text-sm font-semibold leading-5 text-foreground">{title}</span>
    </div>
  );
}

// ============================================================================
// Internal: Code viewer with line numbers
// ============================================================================

function CodeViewer({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div
      className={cn('flex flex-1 gap-6 overflow-auto px-5 py-4 text-sm leading-6', className)}
      style={{ fontFamily: fontFamily.monospace }}
    >
      {/* Line numbers */}
      <div className="flex flex-col text-right text-foreground-subtle select-none">
        {lines.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      {/* Code content */}
      <div className="flex flex-col whitespace-pre text-foreground-muted">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Sample data
// ============================================================================

const codeLines = [
  ' // AI Agent validates invoice data',
  '// Checks for anomalies and fraud patterns',
  '// Cross-references vendor database',
];

const inputJsonLines = [
  '{',
  '  "extracted": {',
  '    "vendor": "Acme Corp",',
  '    "amount": 1250,',
  '    "date": "2024-01-15",',
  '    "items": [',
  '      {',
  '        "description": "Professional Services",',
  '        "amount": 1250',
  '      }',
  '    ]',
  '  },',
  '  "invoiceId": "INV-2024-001",',
  '  "timestamp": "2026-01-28T19:51:41.085Z"',
];

const outputJsonLines = ['{', '  "isValid": true,', '    "confidence": 0.96', '}'];

// ============================================================================
// PropertiesExpanded
// ============================================================================

/**
 * Expanded properties panel for the Flow template.
 *
 * Shows full node details including header, toolbar, code section,
 * and input/output split view. Sits on the right side of the canvas.
 * Functionality will be built out in a future update.
 */
export function PropertiesExpanded({
  className,
  nodeName = 'Validate invoice',
  nodeType = 'AI Agent',
  activeTab = 'properties',
  onClose,
}: PropertiesExpandedProps) {
  return (
    <div
      className={cn(
        'flex w-[930px] shrink-0 flex-col rounded-2xl bg-surface-raised',
        className
      )}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border p-4">
        {/* Left: icon + name */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle">
            <Bot className="h-6 w-6 text-brand-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-5 tracking-[-0.4px] text-foreground">
              {nodeName}
            </span>
            <span className="text-sm font-normal leading-5 tracking-[-0.35px] text-foreground-subtle">
              {nodeType}
            </span>
          </div>
        </div>

        {/* Right: Properties/Variables toggle + close */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center rounded-xl border border-border-deep bg-surface-overlay p-1">
            <button
              className={cn(
                'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5 transition-colors',
                activeTab === 'properties'
                  ? 'border border-border bg-surface text-foreground'
                  : 'text-foreground-subtle'
              )}
            >
              <TableProperties className="h-5 w-5" />
              <span>Properties</span>
            </button>
            <button
              className={cn(
                'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5 transition-colors',
                activeTab === 'variables'
                  ? 'border border-border bg-surface text-foreground'
                  : 'text-foreground-subtle'
              )}
            >
              <Variable className="h-5 w-5" />
              <span>Variables</span>
            </button>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="bg-surface-overlay text-foreground-muted hover:bg-surface-overlay hover:text-foreground [&_svg]:size-5"
            onClick={onClose}
            aria-label="Close properties"
          >
            <X />
          </Button>
        </div>
      </div>

      {/* ── Sub-header toolbar ────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Dock button */}
          <Button
            size="icon"
            variant="ghost"
            className="bg-surface-overlay text-foreground-muted hover:bg-surface-overlay hover:text-foreground [&_svg]:size-5"
            aria-label="Toggle panel dock"
          >
            <PanelRightOpen />
          </Button>
          {/* Layout toggle: columns / rows */}
          <div
            className="flex h-10 items-center rounded-xl border border-border-deep bg-surface-overlay p-1"
            role="group"
            aria-label="Layout toggle"
          >
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-foreground-muted transition-colors hover:text-foreground"
              aria-label="Columns layout"
            >
              <Columns2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface text-foreground"
              aria-label="Rows layout"
            >
              <Rows2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Run node button */}
        <Button className="bg-brand text-foreground-on-accent hover:bg-brand/90 font-semibold">
          <Play className="h-4 w-4" />
          Run node
        </Button>
      </div>

      {/* ── Code section ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden border-b border-border">
        <SectionHeader title="Code" />
        <div className="flex items-center gap-1 px-2 pb-2">
          <MiniTab label="Parameters" />
          <MiniTab label="Script" active />
          <MiniTab label="Errors" />
        </div>
        <CodeViewer lines={codeLines} />
      </div>

      {/* ── Input / Output split ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Input */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <SectionHeader title="Input" />
          <div className="flex items-center gap-1 px-2 pb-2">
            <MiniTab label="JSON" active />
            <MiniTab label="Table" />
            <MiniTab label="List" />
          </div>
          <CodeViewer lines={inputJsonLines} />
        </div>

        {/* Divider */}
        <div className="w-px bg-border-subtle" />

        {/* Output */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <SectionHeader title="Output" />
          <div className="flex items-center gap-1 px-2 pb-2">
            <MiniTab label="JSON" active />
            <MiniTab label="Table" />
            <MiniTab label="List" />
          </div>
          <CodeViewer lines={outputJsonLines} />
        </div>
      </div>
    </div>
  );
}
