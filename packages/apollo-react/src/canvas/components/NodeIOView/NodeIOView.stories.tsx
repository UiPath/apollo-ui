import type { EditorProps } from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  cn,
  type FormSchema,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@uipath/apollo-wind';
import {
  apolloCoreDarkHCMonaco,
  apolloCoreDarkMonaco,
  apolloCoreLightHCMonaco,
  apolloCoreLightMonaco,
  apolloFutureDarkMonaco,
  apolloFutureLightMonaco,
} from '@uipath/apollo-wind/editor-themes';
import { Eye, File, HardDrive, ScanText, Trash2, Upload, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NodeOutputModeSelect } from '../../controls';
import type {
  DeriveTypeIcon,
  JsonCodeEditorRenderProps,
  JsonContainer,
  JsonSchema,
  JsonTreeFilterOption,
  JsonTreeNode,
  JsonValue,
  NodeAction,
  NodeActionsResolver,
  NodeDecoration,
  RenderValueCell,
} from '../JsonTree';
import { isJsonObject } from '../JsonTree';
import { NodePropertyPanel } from '../NodePropertyPanel';
import { NodeIOView } from './NodeIOView';
import type { NodeIOViewTab } from './NodeIOView.types';

// ============================================================================
// Monaco JSON viewer (used for the NodeIOView JSON tab)
//
// @monaco-editor/react ships a CJS build without an `exports` field, so the
// production bundler resolves the default import as undefined. Lazy-loading via
// dynamic import routes through an interop path that extracts it correctly.
// ============================================================================

const _LazyMonaco = lazy(() => import('@monaco-editor/react'));
function MonacoEditor(props: EditorProps) {
  return (
    <Suspense fallback={<div className="min-h-[200px] flex-1" />}>
      <_LazyMonaco {...props} />
    </Suspense>
  );
}

let _monacoThemesRegistered = false;
// biome-ignore lint/suspicious/noExplicitAny: Monaco types not available at story level
function registerMonacoThemes(monaco: any) {
  if (_monacoThemesRegistered) return;
  monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);
  monaco.editor.defineTheme('apollo-future-light', apolloFutureLightMonaco);
  monaco.editor.defineTheme('apollo-core-dark', apolloCoreDarkMonaco);
  monaco.editor.defineTheme('apollo-core-light', apolloCoreLightMonaco);
  monaco.editor.defineTheme('apollo-core-dark-hc', apolloCoreDarkHCMonaco);
  monaco.editor.defineTheme('apollo-core-light-hc', apolloCoreLightHCMonaco);
  _monacoThemesRegistered = true;
}

const THEME_CLASS_MAP: Record<string, string> = {
  'future-dark': 'apollo-future-dark',
  'future-light': 'apollo-future-light',
  dark: 'apollo-core-dark',
  light: 'apollo-core-light',
  'dark-hc': 'apollo-core-dark-hc',
  'light-hc': 'apollo-core-light-hc',
};

function getMonacoThemeName(): string {
  if (typeof document === 'undefined') return 'apollo-future-dark';
  const match = Array.from(document.body.classList).find((c) => c in THEME_CLASS_MAP);
  return match ? THEME_CLASS_MAP[match]! : 'apollo-future-dark';
}

function useMonacoTheme(): string {
  const [themeName, setThemeName] = useState(getMonacoThemeName);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeName(getMonacoThemeName()));
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  return themeName;
}

const JSON_VIEWER_OPTIONS = {
  readOnly: true,
  fontSize: 12,
  lineHeight: 18,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  padding: { top: 8, bottom: 8 },
  lineNumbers: 'off' as const,
  lineDecorationsWidth: 0,
  glyphMargin: false,
  folding: true,
  renderLineHighlight: 'none' as const,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'auto' as const,
    alwaysConsumeMouseWheel: false,
  },
  automaticLayout: true,
} as const;

function MonacoJsonView({ value }: { value: JsonValue | undefined }) {
  const monacoTheme = useMonacoTheme();
  return (
    <MonacoEditor
      height="100%"
      language="json"
      value={JSON.stringify(value ?? null, null, 2)}
      theme={monacoTheme}
      beforeMount={registerMonacoThemes}
      options={JSON_VIEWER_OPTIONS}
    />
  );
}

// Editable Monaco variant wired into NodeIOView's `renderCodeEditor` so that
// editing an object/array value uses a real code editor instead of a textarea.
const CODE_EDITOR_OPTIONS = {
  ...JSON_VIEWER_OPTIONS,
  readOnly: false,
  lineNumbers: 'off' as const,
  lineDecorationsWidth: 8,
  renderLineHighlight: 'line' as const,
} as const;

function MonacoCodeEditor({
  value,
  onChange,
  onApply,
  onCancel,
  invalid,
  autoFocus,
}: JsonCodeEditorRenderProps) {
  const monacoTheme = useMonacoTheme();
  return (
    // Monaco owns most keys; the wrapper only needs Escape (cancel) and
    // Cmd/Ctrl+Enter (apply), matching the textarea fallback's shortcuts.
    <div
      className={cn(
        'overflow-hidden rounded-lg border',
        invalid ? 'border-error' : 'border-border-subtle'
      )}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onApply();
        }
      }}
    >
      <MonacoEditor
        height="160px"
        language="json"
        value={value}
        theme={monacoTheme}
        beforeMount={registerMonacoThemes}
        onChange={(next) => onChange(next ?? '')}
        onMount={(editor) => {
          if (autoFocus) editor.focus();
        }}
        options={CODE_EDITOR_OPTIONS}
      />
    </div>
  );
}

const renderJsonCodeEditor = (props: JsonCodeEditorRenderProps) => <MonacoCodeEditor {...props} />;

// ============================================================================
// Custom file value cell + type badge (shared by Input / Output trees)
// ============================================================================

const deriveFileTypeIcon: DeriveTypeIcon = (node) =>
  node.schema?.format === 'file' ? <File /> : undefined;

const MOCK_FILES = [
  { FullName: 'statement-scan.png', MimeType: 'image/png' },
  { FullName: 'amendment.pdf', MimeType: 'application/pdf' },
];

// The file value cell is display-only; the file affordances live in the row's
// action group (see useFileNodeActions), matching how a real host surfaces
// Upload / Preview / Delete rather than crowding the value cell.
const renderFileValueCell: RenderValueCell = (node) => {
  if (node.schema?.format !== 'file') return undefined;
  const file = isJsonObject(node.value) ? node.value : undefined;
  return (
    <span
      className={cn(
        'truncate font-mono italic text-xs',
        file ? 'text-foreground' : 'italic text-foreground-subtle'
      )}
    >
      {typeof file?.FullName === 'string' ? file.FullName : 'no file'}
    </span>
  );
};

interface PreviewedFile {
  FullName: string;
  MimeType?: string;
}

/**
 * Surfaces file affordances as per-node row actions:
 *   • Upload — always offered on a file row (mock population, no real FS).
 *   • Preview / Delete — only once a file is present.
 * Non-file rows return `undefined` (keep their built-in actions); read-only
 * file rows return `[]`, demonstrating omitting actions for a node.
 */
function useFileNodeActions(): {
  nodeActions: NodeActionsResolver;
  preview: PreviewedFile | null;
  clearPreview: () => void;
} {
  const pickCountRef = useRef(0);
  const [preview, setPreview] = useState<PreviewedFile | null>(null);

  const nodeActions = useCallback<NodeActionsResolver>((node, ctx) => {
    if (node.schema?.format !== 'file') return undefined;
    if (ctx.readOnly) return [];

    const file = isJsonObject(node.value) ? node.value : undefined;
    const actions: NodeAction[] = [
      {
        id: 'upload',
        icon: <Upload />,
        label: file ? `Replace ${node.key}` : `Upload ${node.key}`,
        tooltip: file ? 'Replace file' : 'Upload file',
        onSelect: () => {
          const mock = MOCK_FILES[pickCountRef.current++ % MOCK_FILES.length]!;
          ctx.commit({
            ID: `file-${Math.random().toString(16).slice(2, 6)}`,
            FullName: mock.FullName,
            MimeType: mock.MimeType,
            SizeBytes: Math.floor(Math.random() * 90000) + 1000,
          });
        },
      },
    ];

    if (file) {
      actions.push({
        id: 'preview',
        icon: <Eye />,
        label: `Preview ${node.key}`,
        tooltip: 'Preview file',
        onSelect: () =>
          setPreview({
            FullName: typeof file.FullName === 'string' ? file.FullName : node.key,
            MimeType: typeof file.MimeType === 'string' ? file.MimeType : undefined,
          }),
      });
      actions.push({
        id: 'delete',
        icon: <Trash2 />,
        label: `Delete ${node.key}`,
        tooltip: 'Delete file',
        tone: 'error',
        onSelect: () => ctx.clear(),
      });
    }

    return actions;
  }, []);

  return { nodeActions, preview, clearPreview: () => setPreview(null) };
}

function FilePreviewBanner({ file, onClose }: { file: PreviewedFile; onClose: () => void }) {
  return (
    <div className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1.5 text-xs">
      <Eye size={13} className="shrink-0 text-info" />
      <span className="min-w-0 flex-1 truncate">
        Previewing <span className="font-mono text-foreground">{file.FullName}</span>
        {file.MimeType && <span className="text-foreground-subtle"> · {file.MimeType}</span>}
      </span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded px-1 text-foreground-subtle transition hover:text-foreground"
      >
        Close
      </button>
    </div>
  );
}

// ============================================================================
// Scenario: a Document Extraction node
// ============================================================================

const NODE_ID = 'documentExtraction1';
const NODE_LABEL = 'Document Extraction';

const FILE_TYPE_SCHEMA: JsonSchema = {
  type: 'object',
  format: 'file',
  properties: {
    ID: { type: 'string' },
    FullName: { type: 'string' },
    MimeType: { type: 'string' },
    SizeBytes: { type: 'integer' },
  },
  required: ['ID', 'FullName'],
};

// ── Input: upstream execution data available to the node. Keyed by source node
// id, with each node's fields nested under `output` — matching how the canvas
// exposes upstream data (`$vars.<nodeId>.output.<field>`).
const INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    trigger: {
      type: 'object',
      title: 'Trigger',
      properties: {
        output: {
          type: 'object',
          properties: {
            fileName: { type: 'string' },
            receivedAt: { type: 'string' },
            source: { type: 'string', enum: ['email', 'upload', 'api'] },
            priority: { type: 'integer' },
            isReprocess: { type: 'boolean' },
          },
        },
      },
    },
    readStorageFile1: {
      type: 'object',
      title: 'Read Storage File',
      properties: {
        output: {
          type: 'object',
          properties: {
            document: {
              ...FILE_TYPE_SCHEMA,
              description: 'The source document.',
            },
            pageCount: { type: 'integer' },
            bucket: { type: 'string' },
            checksum: { type: 'string' },
            lastModifiedBy: { type: ['string', 'null'] },
            tags: { type: 'array', items: { type: 'string' } },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  principal: { type: 'string' },
                  access: { type: 'string', enum: ['read', 'read-write'] },
                },
              },
            },
          },
        },
      },
    },
  },
};

const INPUT_VALUE: JsonContainer = {
  trigger: {
    output: {
      fileName: 'invoice-2025-014.pdf',
      receivedAt: '2025-07-14T09:32:00Z',
      source: 'email',
      priority: 2,
      isReprocess: false,
    },
  },
  readStorageFile1: {
    output: {
      document: {
        ID: 'file-inv-014',
        FullName: 'invoice-2025-014.pdf',
        MimeType: 'application/pdf',
        SizeBytes: 218734,
      },
      pageCount: 3,
      bucket: 'incoming-invoices',
      checksum: 'sha256:9f2a7ce5b1d3f4a6c8e7b9d2f1a3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2',
      lastModifiedBy: null,
      tags: ['invoice', 'vendor', 'q3'],
      permissions: [],
    },
  },
};

// ── Output: a believable Document Extraction result.
const OUTPUT_NODE_SCHEMA: JsonSchema = {
  type: 'object',
  required: ['documentType', 'confidence', 'success'],
  properties: {
    documentType: { type: 'string', enum: ['invoice', 'receipt', 'contract'] },
    confidence: {
      type: 'number',
      description: 'Overall extraction confidence.',
    },
    success: { type: 'boolean' },
    pageCount: { type: 'integer' },
    extractionId: { type: 'string' },
    processedAt: { type: 'string' },
    fields: {
      type: 'array',
      description: 'Extracted fields.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
          page: { type: 'integer' },
        },
      },
    },
    tables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          rowCount: { type: 'integer' },
        },
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
};

interface ExtractionField {
  name: string;
  value: string;
  confidence: number;
  page: number;
}

const EXTRACTION_FIELDS: ExtractionField[] = [
  { name: 'VendorName', value: 'Contoso Ltd', confidence: 0.98, page: 1 },
  { name: 'InvoiceTotal', value: '12,480.00', confidence: 0.95, page: 1 },
  { name: 'InvoiceDate', value: '2025-07-01', confidence: 0.99, page: 1 },
  { name: 'DueDate', value: '2025-07-31', confidence: 0.88, page: 1 },
  { name: 'PONumber', value: 'PO-55871', confidence: 0.72, page: 2 },
];

const OUTPUT_NODE_VALUE: JsonValue = {
  documentType: 'invoice',
  confidence: 0.972,
  success: true,
  pageCount: 3,
  extractionId: 'ext-7b3d',
  processedAt: '2025-07-14T09:32:07Z',
  fields: EXTRACTION_FIELDS,
  tables: [{ name: 'LineItems', rowCount: 5 }],
  warnings: [],
};

// Output is wrapped under the node id (title = node label), mirroring
// flow-workbench's buildWrappedOutputSchema — so it renders nested beneath a
// node header, same as the Input source groups.
const OUTPUT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    [NODE_ID]: {
      type: 'object',
      title: NODE_LABEL,
      properties: { output: OUTPUT_NODE_SCHEMA },
    },
  },
};

const OUTPUT_VALUE: JsonContainer = {
  [NODE_ID]: { output: OUTPUT_NODE_VALUE },
};

// Node-style header decorations for the top-level source/self group rows —
// mirrors the flow-workbench Input/Output panels: the source label replaces the
// raw key, the node id shows as a sublabel, and the node icon replaces the type
// badge. Keyed by the top-level path (source node id).
const NODE_HEADERS: Record<string, { label: string; icon: ReactNode }> = {
  trigger: { label: 'Trigger', icon: <Zap /> },
  readStorageFile1: { label: 'Read Storage File', icon: <HardDrive /> },
  [NODE_ID]: { label: NODE_LABEL, icon: <ScanText /> },
};

const decorateNodeHeader = (node: JsonTreeNode): NodeDecoration | undefined => {
  // File containers surface their name through the custom value cell, so the
  // key count (ID / FullName / MimeType / ...) is just noise.
  if (node.schema?.format === 'file') return { hideCount: true };
  if (node.path.includes('.')) return undefined; // top-level group rows only
  const header = NODE_HEADERS[node.path];
  return header
    ? {
        label: header.label,
        sublabel: node.path,
        badge: { icon: header.icon },
        hideCount: true,
      }
    : undefined;
};

// Input fields this node's configuration references (e.g. in expressions);
// drives the toolbar's "Referenced in this node" filter. A referenced
// container shows its whole subtree.
const REFERENCED_PATHS = new Set(['readStorageFile1.output.document', 'trigger.output.fileName']);

const INPUT_FILTERS: JsonTreeFilterOption[] = [
  {
    id: 'referenced',
    label: 'Referenced in this node',
    predicate: (node) => REFERENCED_PATHS.has(node.path),
  },
];

// ── Properties: the node's config form (standard MetadataForm).
const PROPERTIES_FORM: FormSchema = {
  id: 'document-extraction',
  title: NODE_LABEL,
  mode: 'onChange',
  steps: [
    {
      id: 'extraction',
      title: 'Extraction',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'select',
              name: 'model',
              label: 'Extractor',
              defaultValue: 'prebuilt-invoice',
              dataSource: {
                type: 'static',
                options: [
                  { label: 'Invoice (prebuilt)', value: 'prebuilt-invoice' },
                  { label: 'Receipt (prebuilt)', value: 'prebuilt-receipt' },
                  { label: 'Custom taxonomy', value: 'custom' },
                ],
              },
            },
            {
              type: 'text',
              name: 'taxonomyFile',
              label: 'Custom taxonomy',
            },
            {
              type: 'multiselect',
              name: 'fields',
              label: 'Fields to extract',
              defaultValue: ['vendor', 'total', 'date'],
              dataSource: {
                type: 'static',
                options: [
                  { label: 'Vendor', value: 'vendor' },
                  { label: 'Total', value: 'total' },
                  { label: 'Date', value: 'date' },
                  { label: 'Line items', value: 'lineItems' },
                  { label: 'PO number', value: 'po' },
                ],
              },
            },
            {
              type: 'number',
              name: 'minConfidence',
              label: 'Minimum confidence',
              defaultValue: 0.8,
            },
            {
              type: 'switch',
              name: 'autoValidate',
              label: 'Auto-validate high-confidence fields',
              defaultValue: true,
            },
            {
              type: 'switch',
              name: 'extractTables',
              label: 'Extract tables',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [
        {
          id: 'adv',
          fields: [
            {
              type: 'text',
              name: 'node_id',
              label: 'ID',
              defaultValue: NODE_ID,
            },
            {
              type: 'text',
              name: 'label',
              label: 'Label',
              defaultValue: 'Extract invoice fields',
            },
            { type: 'textarea', name: 'description', label: 'Description' },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Custom extra tab: a table view of the extraction results
// ============================================================================

function ExtractionTable({ fields }: { fields: ExtractionField[] }) {
  return (
    <div className="h-full overflow-auto px-(--mf-content-inset,0.875rem) py-2">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="text-left text-foreground-subtle">
            <th className="border-b border-border-subtle py-1.5 pr-2 font-medium">Field</th>
            <th className="border-b border-border-subtle py-1.5 pr-2 font-medium">Value</th>
            <th className="border-b border-border-subtle py-1.5 pr-2 text-right font-medium">
              Confidence
            </th>
            <th className="border-b border-border-subtle py-1.5 text-right font-medium">Page</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="align-top">
              <td className="border-b border-border-subtle/50 py-1.5 pr-2 font-mono">{f.name}</td>
              <td className="border-b border-border-subtle/50 py-1.5 pr-2">{f.value}</td>
              <td
                className={cn(
                  'border-b border-border-subtle/50 py-1.5 pr-2 text-right tabular-nums',
                  f.confidence < 0.8 ? 'text-warning' : 'text-foreground-muted'
                )}
              >
                {(f.confidence * 100).toFixed(0)}%
              </td>
              <td className="border-b border-border-subtle/50 py-1.5 text-right tabular-nums text-foreground-muted">
                {f.page}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Panels
// ============================================================================

// Fills its ResizablePanel; the group carries the card chrome (rounded border
// + shadow) and clips the flush panels. `overflow-hidden` keeps panel content
// from spilling across the resize handles.
const PanelFrame = ({ children }: { children: ReactNode }) => (
  <div className="h-full w-full overflow-hidden">{children}</div>
);

const APOLLO_MODES = ['live', 'static', 'simulated'] as const;

function InputPanel({
  schema,
  initialValue,
  readOnly,
}: {
  schema?: JsonSchema;
  initialValue?: JsonContainer;
  readOnly: boolean;
}) {
  const [value, setValue] = useState<JsonContainer | undefined>(initialValue);
  const { nodeActions, preview, clearPreview } = useFileNodeActions();
  return (
    <PanelFrame>
      <NodePropertyPanel panelTitle="Input" onClose={() => {}} className="h-full">
        <div className="flex h-full flex-col p-6 pt-4">
          {preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
          <NodeIOView
            className="min-h-0 flex-1"
            schema={schema}
            value={value}
            onValueChange={setValue}
            readOnly={readOnly}
            searchPlaceholder="Search inputs..."
            filters={INPUT_FILTERS}
            decorateNode={decorateNodeHeader}
            deriveTypeIcon={deriveFileTypeIcon}
            renderValue={renderFileValueCell}
            nodeActions={nodeActions}
            renderCodeEditor={renderJsonCodeEditor}
            pathForCopy={(path) => `$vars.${path}`}
            jsonView={<MonacoJsonView value={value} />}
          />
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

function PropertiesPanel() {
  return (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        onClose={() => {}}
        nodeIcon={<ScanText />}
        nodeLabel="Extract invoice fields"
        nodeCategory={NODE_LABEL}
        contentInset="1.5rem"
        className="h-full"
        schema={PROPERTIES_FORM}
      />
    </PanelFrame>
  );
}

function OutputPanel({
  showExtractionTab,
  readOnly,
}: {
  showExtractionTab: boolean;
  readOnly: boolean;
}) {
  const [mode, setMode] = useState<(typeof APOLLO_MODES)[number]>('live');
  const [value, setValue] = useState<JsonContainer | undefined>(OUTPUT_VALUE);
  const { nodeActions, preview, clearPreview } = useFileNodeActions();
  // The mocked output is editable only in Static mode (and never when the
  // story forces read-only).
  const isStatic = !readOnly && mode === 'static';

  const extraTabs = useMemo<NodeIOViewTab[] | undefined>(() => {
    if (!showExtractionTab) return undefined;
    return [
      {
        id: 'extraction',
        label: 'Extraction',
        content: <ExtractionTable fields={EXTRACTION_FIELDS} />,
      },
    ];
  }, [showExtractionTab]);

  return (
    <PanelFrame>
      <NodePropertyPanel panelTitle="Output" onClose={() => {}} className="h-full">
        <div className="flex h-full flex-col p-6 pt-4">
          {preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
          <NodeIOView
            className="min-h-0 flex-1"
            title={NODE_LABEL}
            titleIcon={<ScanText />}
            titleBadge={NODE_ID}
            titleTrailing={
              <NodeOutputModeSelect
                value={mode}
                onChange={(m) => setMode(m as (typeof APOLLO_MODES)[number])}
                disabled={readOnly}
              />
            }
            schema={OUTPUT_SCHEMA}
            value={value}
            readOnly={!isStatic}
            onValueChange={isStatic ? setValue : undefined}
            searchPlaceholder="Search output..."
            decorateNode={decorateNodeHeader}
            deriveTypeIcon={deriveFileTypeIcon}
            renderValue={renderFileValueCell}
            nodeActions={nodeActions}
            renderCodeEditor={renderJsonCodeEditor}
            pathForCopy={(path) => `$vars.${path}`}
            extraTabs={extraTabs}
            jsonView={<MonacoJsonView value={value} />}
          />
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

// ============================================================================
// Meta + story
// ============================================================================

// Input panel data variants selectable from the story controls.
const INPUT_DATA = {
  'schema-and-value': { schema: INPUT_SCHEMA, initialValue: INPUT_VALUE },
  'schema-only': { schema: INPUT_SCHEMA, initialValue: undefined },
  'value-only': { schema: undefined, initialValue: INPUT_VALUE },
} as const;

interface StoryArgs {
  showExtractionTab: boolean;
  readOnly: boolean;
  inputData: keyof typeof INPUT_DATA;
}

const meta: Meta<StoryArgs> = {
  // Storybook splits titles on '/', so the leaf must not contain one (quotes
  // don't escape it) — "Node IO" instead of "Node I/O".
  title: 'Components/Panels/Node IO',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
\`NodeIOView\` is the composed node input/output panel body used in the flow
builder: a schema-aware value tree with Schema / JSON tabs, inline editing,
custom value cells, and consumer-provided extra tabs. It is a panel *body*,
composed inside \`NodePropertyPanel\`, which owns the chrome.

This story pieces together the three panels a user sees while working a
**Document Extraction** node (**Input**, **Properties**, **Output**) to show
how they read as a set. Input is driven by upstream execution data; Properties
is a standard \`MetadataForm\` (with a file field); Output is a believable
extraction result with an optional custom **Extraction** table tab (toggle it
with the control below). Switch the Output mode to **Static** to edit the
mocked output inline.

File rows (e.g. the source **document**) surface their affordances as custom
**row actions** via \`nodeActions\`: **Upload** is always offered, while
**Preview** and **Delete** appear only once a file is present — with the
built-in copy/wrap actions omitted for those rows. Preview opens a banner atop
the panel; Upload mock-populates a file.

Use the controls to force read-only mode or swap the Input panel's data:
schema only renders every row as unset, value only drops the schema. The
Input toolbar's filter narrows the tree to fields referenced by this node.

The three panels sit in a resizable split: drag a handle between them to grow
one panel and shrink its neighbor, testing how the tree rows behave at
different widths (truncation, action-button visibility).
        `,
      },
    },
  },
  args: {
    showExtractionTab: true,
    readOnly: false,
    inputData: 'schema-and-value',
  },
  argTypes: {
    showExtractionTab: {
      control: 'boolean',
      description: 'Show the custom Extraction table tab on the Output panel.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Force the Input and Output panels read-only.',
    },
    inputData: {
      control: 'select',
      options: Object.keys(INPUT_DATA),
      description:
        'Input panel data: schema and value, schema only (all rows unset), or value only (no schema).',
    },
  },
};
export default meta;
type Story = StoryObj<StoryArgs>;

export const DocumentExtraction: Story = {
  name: 'Document Extraction (Input / Properties / Output)',
  render: (args) => (
    <div className="flex min-h-screen items-start justify-center p-10">
      {/* ResizablePanelGroup sets an inline height:100%, so the panels' fixed
          height comes from this wrapper's definite height (a height class on
          the group itself would lose to that inline style). */}
      <div className="h-155 w-full max-w-350">
        {/* Split-pane docked panels: drag a handle to grow one panel and shrink
            its neighbor in tandem, exercising the width-sensitive tree layout. */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="overflow-hidden rounded-2xl border border-border-subtle shadow-lg"
        >
          <ResizablePanel defaultSize="33%" minSize="15%">
            {/* Keyed so switching the data variant remounts with fresh edit state. */}
            <InputPanel
              key={args.inputData}
              readOnly={args.readOnly}
              {...INPUT_DATA[args.inputData]}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="34%" minSize="15%">
            <PropertiesPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="33%" minSize="15%">
            <OutputPanel showExtractionTab={args.showExtractionTab} readOnly={args.readOnly} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  ),
};
