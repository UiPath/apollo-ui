import {
  Copy,
  FileJson,
  Folder,
  Redo2,
  RefreshCw,
  Settings2,
  Undo2,
  Variable,
  Webhook,
  X,
} from 'lucide-react';
import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface PropertiesSimpleFieldOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
}

export interface PropertiesSimpleField {
  /** Field label */
  label: string;
  /** Whether field is required (shows asterisk) */
  required?: boolean;
  /** Current value displayed in the field */
  value?: string;
  /** Placeholder when no value is set */
  placeholder?: string;
  /** Whether the field has a value (uses filled styling) */
  filled?: boolean;
  /** Field type */
  type?: 'select' | 'input' | 'url';
  /** Options for select fields */
  options?: PropertiesSimpleFieldOption[];
  /** Show the "Graph control" icon */
  showGraphControl?: boolean;
}

export interface PropertiesSimpleSection {
  /** Section label (displayed uppercase) */
  label: string;
  /** Whether the section starts expanded */
  defaultExpanded?: boolean;
  /** Fields inside the section */
  fields?: PropertiesSimpleField[];
}

export interface PropertiesSimpleProps {
  className?: string;
  /** Icon to show in the header (defaults to Webhook) */
  icon?: React.ReactNode;
  /** Title shown in the header */
  title?: string;
  /** Top-level fields (above accordion sections) */
  fields?: PropertiesSimpleField[];
  /** Collapsible accordion sections */
  sections?: PropertiesSimpleSection[];
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Callback when Graph control is clicked on a field */
  onGraphControl?: (fieldLabel: string) => void;
}

// ============================================================================
// Internal: Field item (uses real shadcn components)
// ============================================================================

function FieldItem({
  field,
  onGraphControl,
}: {
  field: PropertiesSimpleField;
  onGraphControl?: (label: string) => void;
}) {
  const [value, setValue] = React.useState(field.value ?? '');

  return (
    <div className="flex flex-col gap-1 pt-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium leading-5 text-future-foreground-muted">
          {field.label}
          {field.required && '*'}
        </span>
        {field.showGraphControl && (
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-future-surface-overlay text-future-foreground-muted transition-colors hover:text-future-foreground"
            onClick={() => onGraphControl?.(field.label)}
            aria-label="Graph control"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Field control */}
      {field.type === 'select' ? (
        <Select value={value || undefined} onValueChange={setValue}>
          <SelectTrigger
            className={cn(
              'h-10 rounded-xl border-0 shadow-sm',
              value
                ? 'bg-future-surface-hover text-future-foreground'
                : 'bg-future-surface-overlay text-future-foreground-muted'
            )}
          >
            <SelectValue placeholder={field.placeholder ?? 'Select...'} />
          </SelectTrigger>
          <SelectContent className="border-future-border bg-future-surface-overlay text-future-foreground">
            {(field.options ?? []).map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="focus:bg-future-surface-hover focus:text-future-foreground"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'url' ? (
        <div className="flex h-10 items-center overflow-hidden rounded-xl bg-future-surface-overlay shadow-sm">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.placeholder}
            className="h-full flex-1 rounded-none border-0 bg-transparent text-sm font-medium text-future-foreground-muted shadow-none placeholder:text-future-foreground-subtle focus-visible:ring-0"
          />
          <button
            type="button"
            className="flex h-full w-[50px] items-center justify-center border-l border-future-border text-future-foreground-muted transition-colors hover:text-future-foreground"
            aria-label="Browse files"
          >
            <Folder className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={field.placeholder}
          className={cn(
            'h-10 rounded-xl border-0 text-sm font-medium shadow-sm',
            value
              ? 'bg-future-surface-hover text-future-foreground'
              : 'bg-future-surface-overlay text-future-foreground-muted placeholder:text-future-foreground-subtle'
          )}
        />
      )}
    </div>
  );
}

// ============================================================================
// Internal: JSON Editor Drawer
// ============================================================================

const sampleJsonLines = [
  '{',
  '  "extracted": {',
  '    "vendor": "Acme Corp",',
  '    "amount": 1250,',
  '    "date": "2024-01-15",',
  '    "items": [',
  '      {',
  '        "description": "Professional',
  '  Services",',
  '        "amount": 1250',
  '      }',
  '    ]',
  '  },',
  '  "invoiceId": "INV-2024-001",',
  '  "timestamp": "2026-01-28T19:51:41.085Z"',
  '}',
];

function EditorToolbarButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-lg text-future-foreground-muted transition-colors hover:text-future-foreground"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function JsonEditorDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-future-border bg-future-surface-raised">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-base font-semibold leading-5 tracking-[-0.4px] text-future-foreground">
          JSON editor
        </span>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-surface-overlay text-future-foreground-muted transition-colors hover:text-future-foreground"
          onClick={onClose}
          aria-label="Close editor"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 pb-4">
        <EditorToolbarButton icon={<Undo2 className="h-5 w-5" />} label="Undo" />
        <EditorToolbarButton icon={<Redo2 className="h-5 w-5" />} label="Redo" />
        <EditorToolbarButton icon={<Variable className="h-5 w-5" />} label="Variables" />
        <EditorToolbarButton icon={<Copy className="h-5 w-5" />} label="Copy" />
      </div>

      {/* ── Code editor area ────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden px-6 pb-4">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-future-border-subtle bg-future-surface shadow-sm">
          {/* File header */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2 text-future-foreground-muted">
              <FileJson className="h-4 w-4" />
              <span className="text-sm font-medium leading-none">script.js</span>
            </div>
            <button
              className="flex h-5 w-5 items-center justify-center text-future-foreground-muted transition-colors hover:text-future-foreground"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Code content */}
          <div
            className="flex flex-1 gap-6 overflow-auto px-3 py-3 text-sm leading-6"
            style={{ fontFamily: fontFamily.monospace }}
          >
            {/* Line numbers */}
            <div className="flex flex-col text-right text-future-foreground-subtle select-none">
              {sampleJsonLines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            {/* Code */}
            <div className="flex flex-col whitespace-pre text-future-foreground-muted">
              {sampleJsonLines.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 px-6 py-4">
        <button
          className="flex h-10 items-center gap-2 rounded-xl border border-future-border px-4 py-2 text-sm font-medium leading-5 text-future-foreground-subtle transition-colors hover:text-future-foreground"
          onClick={onClose}
        >
          <span>Cancel</span>
        </button>
        <button
          className="flex h-10 items-center gap-2 rounded-xl bg-future-accent px-4 py-2 text-sm font-semibold leading-5 text-future-foreground-inverse transition-colors hover:bg-future-accent/90"
          onClick={onClose}
        >
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PropertiesSimple
// ============================================================================

/**
 * Simple properties panel for the Flow template.
 *
 * A compact right-side panel that shows node configuration fields
 * and collapsible accordion sections. Based on the "Properties 1"
 * Figma component.
 *
 * Features:
 * - Header with node icon, title, and close button
 * - Real shadcn Select, Input components for interactive fields
 * - Shadcn Accordion for collapsible sections
 * - "Graph control" icon opens a JSON editor drawer
 */
export function PropertiesSimple({
  className,
  icon,
  title = 'HTTP Request',
  fields = [],
  sections = [],
  onClose,
  onGraphControl,
}: PropertiesSimpleProps) {
  const [editorOpen, setEditorOpen] = React.useState(false);

  const handleGraphControl = (fieldLabel: string) => {
    onGraphControl?.(fieldLabel);
    setEditorOpen(true);
  };

  // Build default expanded keys for accordion
  const defaultExpandedKeys = sections.filter((s) => s.defaultExpanded).map((s) => s.label);

  return (
    <div className="relative h-full w-[360px] shrink-0">
      {/* ── Properties panel ──────────────────────────────────── */}
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-2xl border border-future-border bg-future-surface-raised',
          className
        )}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-future-border px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-accent-subtle">
              {icon ?? <Webhook className="h-6 w-6 text-future-accent-foreground" />}
            </div>
            <span className="text-base font-semibold leading-5 tracking-[-0.4px] text-future-foreground">
              {title}
            </span>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-future-surface-overlay text-future-foreground-muted transition-colors hover:text-future-foreground"
            onClick={onClose}
            aria-label="Close properties"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable content ─────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Top-level fields */}
          {fields.length > 0 && (
            <div className="flex flex-col px-6 pb-2">
              {fields.map((field) => (
                <FieldItem key={field.label} field={field} onGraphControl={handleGraphControl} />
              ))}
            </div>
          )}

          {/* Accordion sections */}
          {sections.length > 0 && (
            <Accordion type="multiple" defaultValue={defaultExpandedKeys} className="px-6">
              {sections.map((section) => (
                <AccordionItem
                  key={section.label}
                  value={section.label}
                  className="border-b border-future-border-subtle"
                >
                  <AccordionTrigger className="py-4 hover:no-underline [&>svg]:text-future-foreground-muted">
                    <span className="text-xs font-medium uppercase leading-6 tracking-wide text-future-foreground-muted">
                      {section.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pt-0">
                    {section.fields && section.fields.length > 0 && (
                      <div className="flex flex-col">
                        {section.fields.map((field) => (
                          <FieldItem
                            key={field.label}
                            field={field}
                            onGraphControl={handleGraphControl}
                          />
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* ── JSON Editor Drawer (overlays the properties panel) ── */}
      {editorOpen && (
        <div className="absolute inset-y-0 right-0 z-20 w-[480px]">
          <JsonEditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} />
        </div>
      )}
    </div>
  );
}
