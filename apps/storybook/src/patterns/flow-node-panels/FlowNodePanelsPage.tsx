import {
  BaseCanvas,
  type BaseNodeData,
  CanvasIcon,
  CanvasLeftSidebar,
  type CanvasLeftSidebarItemId,
  CanvasZoomControls,
  NodePropertyPanel,
} from '@uipath/apollo-react/canvas';
import { createNode, useCanvasStory } from '@uipath/apollo-react/canvas/storybook-utils';
import {
  type Node,
  type NodeProps,
  useNodesInitialized,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  type CustomFieldComponentProps,
  FormField,
  FormFieldDescription,
  FormFieldLabel,
  type FormPlugin,
  ToggleGroup,
  ToggleGroupItem,
} from '@uipath/apollo-wind';
import { Check, Link2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NodeInventoryPanel } from '../../../../../packages/apollo-react/src/canvas/stories/templates/node-inventory';
import {
  FLOW_CUSTOM_COMPONENTS,
  FLOW_NODE_PANEL_GROUPS,
  FLOW_NODE_PANEL_ITEMS,
  FLOW_SNAPSHOT_SOURCE,
  type FlowNodePanelItem,
  findFlowNodePanelItem,
  toPanelSchema,
} from './flow-node-catalog';

export const FLOW_NODE_PANELS_STORY_ID = 'apollo-wind-patterns-layout-patterns--flow-node-panels';

type PanelSource = 'flow-definition' | 'design-reference';

const ITEMS_PER_ROW = 8;
const COLUMN_WIDTH = 245;
const ROW_HEIGHT = 150;
const PANEL_OFFSET = 412;

/**
 * Stands in for Flow's own custom editors (prompt editor, code editor, pickers…),
 * which live in flow-workbench and have no Apollo equivalent yet. Naming the
 * component keeps each gap visible instead of rendering nothing.
 */
function FlowCustomFieldPlaceholder({ name, field, required }: CustomFieldComponentProps) {
  const component = field?.type === 'custom' ? field.component : 'custom';
  return (
    <FormField>
      <FormFieldLabel id={`${name}-label`} required={required}>
        {field?.label}
      </FormFieldLabel>
      <div
        role="group"
        aria-labelledby={`${name}-label`}
        className="rounded-lg border border-dashed border-border-subtle bg-surface-overlay px-3 py-2.5"
      >
        <p className="text-xs text-foreground-muted">Flow custom field</p>
        <p className="font-mono text-xs text-foreground">{component}</p>
      </div>
      <FormFieldDescription>{field?.description}</FormFieldDescription>
    </FormField>
  );
}

const FLOW_CUSTOM_FIELDS_PLUGIN: FormPlugin = {
  name: 'flow-node-panels-custom-fields',
  components: Object.fromEntries(
    FLOW_CUSTOM_COMPONENTS.map((component) => [component, FlowCustomFieldPlaceholder])
  ),
};
const PANEL_PLUGINS = [FLOW_CUSTOM_FIELDS_PLUGIN];

function GroupLabelNode({ data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="grid h-24 w-36 place-items-start rounded-2xl border-2 border-brand/40 bg-brand-subtle p-4 text-sm font-semibold text-foreground shadow-sm">
      {data.display?.label}
    </div>
  );
}

const nodeTypes = { 'flow-node-group': GroupLabelNode };

function itemSubLabel(item: FlowNodePanelItem) {
  if (item.source === 'dynamic-example') return 'Dynamic example';
  const version = `v${item.manifest?.version}`;
  return item.designReference ? `${version} · Design reference` : version;
}

function createCatalogNodes(): Node<BaseNodeData>[] {
  let y = 0;
  return FLOW_NODE_PANEL_GROUPS.flatMap((group) => {
    const groupY = y;
    y += Math.ceil(group.items.length / ITEMS_PER_ROW) * ROW_HEIGHT;
    const groupNode = createNode({
      id: `group-${group.name}`,
      type: 'flow-node-group',
      position: { x: 0, y: groupY },
      display: { label: `${group.name} (${group.items.length})` },
      data: { flowNodeGroup: true },
    });
    const itemNodes = group.items.map((item, index) =>
      createNode({
        id: item.slug,
        type: 'uipath.blank-node',
        position: {
          x: 190 + (index % ITEMS_PER_ROW) * COLUMN_WIDTH,
          y: groupY + 8 + Math.floor(index / ITEMS_PER_ROW) * ROW_HEIGHT,
        },
        display: { label: item.label, subLabel: itemSubLabel(item), icon: item.icon },
        data: { flowNodeType: item.nodeType },
      })
    );
    return [groupNode, ...itemNodes];
  });
}

function CatalogCanvas({
  selectedSlug,
  onSelect,
}: {
  selectedSlug?: string;
  onSelect: (slug: string) => void;
}) {
  const initialNodes = useMemo(createCatalogNodes, []);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: [],
    additionalNodeTypes: nodeTypes,
  });
  const nodes = useMemo(
    () =>
      canvasProps.nodes?.map((node: Node<BaseNodeData>) => ({
        ...node,
        selected: node.id === selectedSlug,
      })),
    [canvasProps.nodes, selectedSlug]
  );

  // A deep link opens zoomed to its node; otherwise the whole catalog fits.
  const [initialSlug] = useState(selectedSlug);
  useEffect(() => {
    if (!nodesInitialized) return;
    void fitView(
      initialSlug
        ? { nodes: [{ id: initialSlug }], padding: 3, maxZoom: 0.85, duration: 0 }
        : { padding: 0.08, maxZoom: 0.85, duration: 0 }
    );
  }, [fitView, initialSlug, nodesInitialized]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <BaseCanvas
        {...canvasProps}
        nodes={nodes}
        mode="view"
        fitView
        fitViewOptions={{ padding: 0.08, maxZoom: 0.85 }}
        onNodeClick={(_event, node) => {
          if (node.data.flowNodeGroup) return;
          onSelect(node.id);
        }}
      />
      <div
        className="absolute bottom-5 z-20 transition-[right] duration-200"
        style={{ right: selectedSlug ? PANEL_OFFSET : 16 }}
      >
        <CanvasZoomControls
          orientation="vertical"
          onOrganize={() => void fitView({ padding: 0.08, duration: 200, maxZoom: 0.85 })}
        />
      </div>
    </div>
  );
}

/** The shareable Storybook link for one node's panel. */
function panelLink(slug: string) {
  const query = `?path=/story/${FLOW_NODE_PANELS_STORY_ID}&args=node:${slug}`;
  try {
    const top = window.top?.location;
    if (top) return `${top.origin}${top.pathname}${query}`;
  } catch {
    // Cross-origin embed: fall back to this frame's origin.
  }
  return `${window.location.origin}/${query}`;
}

function PageHeader({
  item,
  panelSource,
  onPanelSourceChange,
}: {
  item?: FlowNodePanelItem;
  panelSource: PanelSource;
  onPanelSourceChange: (source: PanelSource) => void;
}) {
  const [copiedSlug, setCopiedSlug] = useState<string>();
  const copied = item !== undefined && copiedSlug === item.slug;
  const flowCount = FLOW_NODE_PANEL_ITEMS.filter((i) => i.source === 'flow-definition').length;
  const dynamicCount = FLOW_NODE_PANEL_ITEMS.length - flowCount;
  const referenceCount = FLOW_NODE_PANEL_ITEMS.filter((i) => i.designReference).length;

  return (
    <div className="absolute left-4 top-4 z-20 w-[340px] rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <h1 className="text-sm font-semibold text-foreground">Flow Node Panels</h1>
      <p className="mt-1 text-xs leading-5 text-foreground-muted">
        {flowCount} Flow Workbench nodes and {dynamicCount} dynamic examples. Select a node to see
        its right panel. {referenceCount} have a Figma design reference.
      </p>
      <p className="mt-1 text-[11px] text-foreground-subtle">
        Snapshot of flow-workbench@{FLOW_SNAPSHOT_SOURCE.commit} ·{' '}
        {FLOW_SNAPSHOT_SOURCE.generatedAt}
      </p>
      {item && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate font-mono text-[11px] text-foreground-muted">
              {item.nodeType}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 shrink-0 px-2 text-xs"
              onClick={() => {
                void navigator.clipboard
                  .writeText(panelLink(item.slug))
                  .then(() => setCopiedSlug(item.slug));
              }}
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            className="w-full"
            value={item.designReference ? panelSource : 'flow-definition'}
            onValueChange={(value) => value && onPanelSourceChange(value as PanelSource)}
            aria-label="Panel source"
          >
            <ToggleGroupItem value="flow-definition" className="flex-1 text-xs">
              Flow definition
            </ToggleGroupItem>
            <ToggleGroupItem
              value="design-reference"
              className="flex-1 text-xs"
              disabled={!item.designReference}
            >
              Design reference
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}

function FlowNodePanel({
  item,
  panelSource,
  onClose,
}: {
  item: FlowNodePanelItem;
  panelSource: PanelSource;
  onClose: () => void;
}) {
  if (item.designReference && (panelSource === 'design-reference' || !item.manifest)) {
    return <NodeInventoryPanel item={item.designReference} onClose={onClose} />;
  }

  const identity = {
    panelTitle: 'Properties',
    nodeIcon: <CanvasIcon icon={item.icon} size={22} />,
    nodeLabel: item.label,
    nodeCategory: item.group,
    onClose,
    className: 'h-full',
  };

  if (!item.manifest) {
    return (
      <NodePropertyPanel {...identity}>
        <p className="py-4 text-xs leading-5 text-foreground-muted [padding-inline:var(--mf-content-inset,1rem)]">
          This node's form comes from a runtime catalog at design time, so Flow has no static
          definition for it and Apollo has no reference panel yet.
        </p>
      </NodePropertyPanel>
    );
  }

  return (
    <NodePropertyPanel
      {...identity}
      schema={toPanelSchema(item.manifest)}
      plugins={PANEL_PLUGINS}
      sectionVariant="plain"
      resetKey={item.slug}
      autoComplete="off"
    />
  );
}

export function FlowNodePanelsPage({
  nodeSlug,
  onNodeSelect,
}: {
  nodeSlug?: string;
  onNodeSelect: (slug: string) => void;
}) {
  const item = findFlowNodePanelItem(nodeSlug);
  const [panelSource, setPanelSource] = useState<PanelSource>('flow-definition');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<CanvasLeftSidebarItemId>('variables');

  return (
    <div className="relative flex h-screen bg-surface">
      <CanvasLeftSidebar
        title="Variables"
        variant="default"
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        activeItemId={activeSidebarItem}
        onItemSelect={setActiveSidebarItem}
      />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <CatalogCanvas selectedSlug={item?.slug} onSelect={onNodeSelect} />
        <PageHeader item={item} panelSource={panelSource} onPanelSourceChange={setPanelSource} />
      </div>
      {item && (
        <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">
          <div className="h-full w-[380px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
            <FlowNodePanel item={item} panelSource={panelSource} onClose={() => onNodeSelect('')} />
          </div>
        </div>
      )}
    </div>
  );
}
