import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@uipath/apollo-wind';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import {
  buildJsonTree,
  collectContainerPaths,
  type JsonContainer,
  JsonTree,
  type JsonTreeNode,
  JsonTreeToolbar,
  type JsonValue,
  removeValueAtPath,
  setValueAtPath,
} from '../JsonTree';
import type { NodeIOViewProps } from './NodeIOView.types';
import { PanelTitleBar } from './PanelTitleBar';

// Matches the tab chrome TabbedStepForm uses inside MetadataForm so the panel
// blends with schema-driven property panels.
const TAB_LIST_CLASS =
  'h-auto justify-start gap-0.5 rounded-lg bg-transparent p-0 text-muted-foreground';
const TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';

/**
 * NodeIOView renders a JSON value merged with its JSON Schema as an
 * interactive tree, alongside a raw JSON view. It is domain-agnostic: any
 * schema/value pair works (node inputs and outputs on a canvas are one use
 * case, composed via `title`/`titleTrailing` and `extraTabs`).
 *
 * The structure comes from a JSON Schema and the data from a plain JSON value.
 * Keys declared by the schema but absent from the value are still shown (as
 * "unset", settable inline). Rows can be annotated through `decorateNode` and
 * filtered through consumer-provided `filters`. All value types edit inline:
 * strings, numbers, and nulls through a text editor, booleans and enums
 * through a dropdown, objects and arrays through a JSON editor; custom cells
 * (e.g. file pickers) plug in through `renderValue`.
 *
 * The component is a panel *body* with its own uniform padding: compose it
 * inside `NodePropertyPanel` (or any docked host) which owns the chrome.
 *
 * @example
 * ```tsx
 * <NodePropertyPanel panelTitle="Output" onClose={deselect} contentInset="0.875rem">
 *   <NodeIOView
 *     title="HTTP Request"
 *     titleBadge="httpRequest1"
 *     titleTrailing={<NodeOutputModeSelect value={mode} onChange={setMode} />}
 *     schema={outputSchema}
 *     value={outputValue}
 *     onValueChange={setOutputValue}
 *   />
 * </NodePropertyPanel>
 * ```
 */
export function NodeIOView({
  schema,
  value,
  onValueChange,
  basePath,
  readOnly = false,
  title,
  titleIcon,
  titleBadge,
  titleTrailing,
  searchPlaceholder,
  emptyMessage,
  jsonView,
  extraTabs,
  defaultTab,
  onTabChange,
  beforeContent,
  rowWrapper,
  filters,
  decorateNode,
  deriveTypeIcon,
  renderValue,
  nodeActions,
  maxInlineActions,
  renderCodeEditor,
  pathForCopy,
  onCopy,
  defaultCollapsedDepth = 2,
  className,
}: NodeIOViewProps) {
  const { _ } = useSafeLingui();
  const nodes = useMemo(
    () => buildJsonTree({ schema, value, basePath }),
    [schema, value, basePath]
  );
  const containerPaths = useMemo(() => collectContainerPaths(nodes), [nodes]);

  const [query, setQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const activeFilter = filters?.find((f) => f.id === activeFilterId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      containerPaths.filter((c) => c.depth >= defaultCollapsedDepth).map((c) => [c.path, true])
    )
  );

  // Derived: fall back to Schema when the selected tab no longer resolves
  // (e.g. the extra tabs changed with the node type). Without this, <Tabs>
  // would have no matching content and the panel would render blank.
  const [selectedTab, setSelectedTab] = useState(defaultTab ?? 'schema');
  const activeTab = useMemo(() => {
    const validIds = new Set(['schema', 'json', ...(extraTabs?.map((tab) => tab.id) ?? [])]);
    return validIds.has(selectedTab) ? selectedTab : 'schema';
  }, [selectedTab, extraTabs]);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    onTabChange?.(tabId);
  };

  const tabs = useMemo(
    () => [
      {
        id: 'schema',
        label: _({
          id: 'canvas.json_value_panel.schema_tab',
          message: 'Schema',
        }),
      },
      {
        id: 'json',
        label: _({ id: 'canvas.json_value_panel.json_tab', message: 'JSON' }),
      },
      ...(extraTabs?.map((tab) => ({ id: tab.id, label: tab.label })) ?? []),
    ],
    [extraTabs, _]
  );
  // Extra tabs make a horizontal pill strip too wide for a properties dialog, so
  // collapse to a labelled dropdown once any are present (mirrors flow-workbench).
  const useTabDropdown = (extraTabs?.length ?? 0) > 0;
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? tabs[0]!.label;

  const tabSwitcher = useTabDropdown ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="3xs"
          className="gap-1 px-2 text-foreground"
          aria-label={_({
            id: 'canvas.json_value_panel.view_switcher',
            message: 'View: {label}',
            values: { label: activeTabLabel },
          })}
        >
          <span className="text-xs font-medium">{activeTabLabel}</span>
          <ChevronDown size={13} className="text-foreground-subtle" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuRadioGroup value={activeTab} onValueChange={handleTabChange}>
          {tabs.map((tab) => (
            <DropdownMenuRadioItem
              key={tab.id}
              value={tab.id}
              className="cursor-pointer text-[11px] [&>span:first-child]:text-foreground-accent"
            >
              {tab.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <TabsList className={TAB_LIST_CLASS}>
      {tabs.map((tab) => (
        <TabsTrigger key={tab.id} value={tab.id} className={TAB_TRIGGER_CLASS}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  const allCollapsed = containerPaths.length > 0 && containerPaths.every((c) => collapsed[c.path]);

  const toggleCollapsed = (path: string) =>
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));

  const toggleAll = () => {
    setCollapsed(allCollapsed ? {} : Object.fromEntries(containerPaths.map((c) => [c.path, true])));
  };

  const handleEdit = (node: JsonTreeNode, nodeValue: JsonValue | undefined) => {
    const next =
      nodeValue === undefined
        ? removeValueAtPath(value, node.segments)
        : setValueAtPath(value, node.segments, nodeValue);
    // Editing a nested path preserves the root container shape, so the result
    // is still an object/array (setValueAtPath/removeValueAtPath return the
    // broad JsonValue type, hence the assertion).
    onValueChange?.((next ?? {}) as JsonContainer, {
      path: node.path,
      segments: node.segments,
      value: nodeValue,
      previous: node.value,
    });
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-4', className)}>
      {title && (
        <PanelTitleBar
          icon={titleIcon}
          title={title}
          badge={titleBadge}
          trailing={titleTrailing}
          className="shrink-0"
        />
      )}

      {beforeContent && <div className="shrink-0">{beforeContent}</div>}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <JsonTreeToolbar
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          activeFilterId={activeFilterId}
          onFilterChange={setActiveFilterId}
          allCollapsed={allCollapsed}
          onToggleAll={containerPaths.length > 0 ? toggleAll : undefined}
          leading={tabSwitcher}
          // Search / filter / collapse act on the schema tree only.
          controlsHidden={activeTab !== 'schema'}
          className="shrink-0"
        />

        <TabsContent value="schema" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-overlay bg-surface-overlay/40">
            <JsonTree
              nodes={nodes}
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
              query={query}
              filterPredicate={activeFilter?.predicate}
              readOnly={readOnly || !onValueChange}
              onEdit={handleEdit}
              rowWrapper={rowWrapper}
              decorateNode={decorateNode}
              deriveTypeIcon={deriveTypeIcon}
              renderValue={renderValue}
              nodeActions={nodeActions}
              maxInlineActions={maxInlineActions}
              renderCodeEditor={renderCodeEditor}
              pathForCopy={pathForCopy}
              onCopy={onCopy}
              // JsonTree shows its own "no match" text while a search or
              // filter is active; this only covers the genuinely-empty case.
              emptyMessage={emptyMessage}
            />
          </div>
        </TabsContent>

        <TabsContent value="json" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-overlay bg-surface-overlay/40">
            {jsonView ?? (
              <pre className="h-full overflow-auto p-3 font-mono text-xs leading-4.5 text-foreground">
                {JSON.stringify(value ?? null, null, 2)}
              </pre>
            )}
          </div>
        </TabsContent>

        {extraTabs?.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 flex min-h-0 flex-1 flex-col">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
