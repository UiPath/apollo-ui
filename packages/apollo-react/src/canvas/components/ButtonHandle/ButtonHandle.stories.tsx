import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { FontVariantToken } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApTypography } from '@uipath/apollo-react/material';
import {
  ApCheckbox,
  ApDropdown,
  ApDropdownItem,
  ApIcon,
  ApIconButton,
} from '@uipath/portal-shell-react';

import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas/BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { type ButtonHandleConfig, ButtonHandles, type HandleActionEvent } from './ButtonHandle';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof ButtonHandles> = {
  title: 'Canvas/ButtonHandles',
  component: ButtonHandles,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Custom Node Components (for direct ButtonHandles demos)
// ============================================================================

/**
 * Simple node demonstrating ButtonHandles on all four sides.
 */
function SimpleNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label: string; subLabel: string };
  selected: boolean;
}) {
  const topHandles: ButtonHandleConfig[] = [
    {
      id: 'top',
      type: 'source',
      handleType: 'artifact',
      label: 'Escalations',
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log('Escalations clicked', event);
        alert('Escalations clicked!');
      },
    },
  ];

  const bottomHandles: ButtonHandleConfig[] = [
    {
      id: 'bottom-memory',
      type: 'source',
      handleType: 'artifact',
      label: 'Memory',
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log('Memory clicked', event);
        alert('Memory clicked!');
      },
    },
    {
      id: 'bottom-context',
      type: 'source',
      handleType: 'artifact',
      label: 'Context',
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log('Context clicked', event);
        alert('Context clicked!');
      },
    },
  ];

  const leftHandles: ButtonHandleConfig[] = [{ id: 'left', type: 'target', handleType: 'input' }];

  const rightHandles: ButtonHandleConfig[] = [
    {
      id: 'right',
      type: 'source',
      handleType: 'output',
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log('Output clicked', event);
        alert('Output clicked!');
      },
    },
  ];

  return (
    <div
      style={{
        width: 240,
        height: 70,
        borderRadius: 8,
        backgroundColor: 'var(--uix-canvas-background)',
        border: selected
          ? '1px solid var(--uix-canvas-selection-indicator)'
          : '1px solid var(--uix-canvas-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 16,
      }}
    >
      <Row w="100%" gap={12} align="center">
        <ApIcon name="smart_toy" size="32px" color="var(--uix-canvas-foreground-de-emp)" />
        <Column>
          <ApTypography
            variant={FontVariantToken.fontSizeSBold}
            color="var(--uix-canvas-foreground-de-emp)"
          >
            {data.label}
          </ApTypography>
          <ApTypography
            variant={FontVariantToken.fontSizeS}
            color="var(--uix-canvas-foreground-de-emp)"
          >
            {data.subLabel}
          </ApTypography>
        </Column>
      </Row>
      <ButtonHandles nodeId={id} handles={topHandles} position={Position.Top} selected={selected} />
      <ButtonHandles
        nodeId={id}
        handles={bottomHandles}
        position={Position.Bottom}
        selected={selected}
      />
      <ButtonHandles
        nodeId={id}
        handles={leftHandles}
        position={Position.Left}
        selected={selected}
      />
      <ButtonHandles
        nodeId={id}
        handles={rightHandles}
        position={Position.Right}
        selected={selected}
      />
    </div>
  );
}

/**
 * Handle configuration state for the configurable node.
 */
interface HandleConfigState {
  top: ButtonHandleConfig[];
  bottom: ButtonHandleConfig[];
  left: ButtonHandleConfig[];
  right: ButtonHandleConfig[];
}

/**
 * Configurable node that receives handle configurations from parent state.
 */
function ConfigurableNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: { label: string; handleConfig: HandleConfigState };
  selected: boolean;
}) {
  const { handleConfig } = data;

  return (
    <div
      style={{
        width: 300,
        height: 150,
        borderRadius: 8,
        backgroundColor: 'var(--uix-canvas-background)',
        border: selected
          ? '1px solid var(--uix-canvas-selection-indicator)'
          : '1px solid var(--uix-canvas-foreground-de-emp)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--uix-canvas-foreground)' }}>
        {data.label}
      </div>
      <ButtonHandles
        nodeId={id}
        handles={handleConfig.top}
        position={Position.Top}
        selected={selected}
      />
      <ButtonHandles
        nodeId={id}
        handles={handleConfig.bottom}
        position={Position.Bottom}
        selected={selected}
      />
      <ButtonHandles
        nodeId={id}
        handles={handleConfig.left}
        position={Position.Left}
        selected={selected}
      />
      <ButtonHandles
        nodeId={id}
        handles={handleConfig.right}
        position={Position.Right}
        selected={selected}
      />
    </div>
  );
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const nodeTypes = useMemo(() => ({ simpleNode: SimpleNode }), []);
  const { canvasProps } = useCanvasStory({
    initialNodes: [
      {
        id: '1',
        type: 'simpleNode',
        position: { x: 250, y: 150 },
        data: { label: 'Screener agent', subLabel: 'Agent', parameters: {} },
      },
    ],
  });

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel
        title="ButtonHandles"
        description="Click + buttons on handles to trigger actions"
      />
    </BaseCanvas>
  );
}

// Shared action handler for demo purposes
const handleAction = (event: HandleActionEvent) => console.log('Handle action:', event);

/**
 * Default handle configurations for the configurable story.
 */
const DEFAULT_HANDLE_CONFIG: HandleConfigState = {
  top: [
    {
      id: 'out1',
      type: 'source',
      handleType: 'output',
      label: 'Output 1',
      showButton: true,
      onAction: handleAction,
    },
    {
      id: 'out2',
      type: 'source',
      handleType: 'output',
      label: 'Output 2',
      showButton: true,
      onAction: handleAction,
    },
  ],
  bottom: [
    { id: 'in1', type: 'target', handleType: 'input', label: 'Input 1' },
    { id: 'in2', type: 'target', handleType: 'input', label: 'Input 2' },
  ],
  left: [{ id: 'config', type: 'target', handleType: 'artifact', label: 'Config' }],
  right: [
    {
      id: 'success',
      type: 'source',
      handleType: 'output',
      label: 'Success',
      color: 'var(--uix-canvas-success-icon)',
      showButton: true,
      onAction: handleAction,
    },
    {
      id: 'error',
      type: 'source',
      handleType: 'output',
      label: 'Error',
      color: 'var(--uix-canvas-error-icon)',
      showButton: true,
      onAction: handleAction,
    },
  ],
};

type HandleTypeOption = 'input' | 'output' | 'artifact';

const HANDLE_TYPE_CONFIG: Record<HandleTypeOption, { type: 'source' | 'target'; label: string }> = {
  input: { type: 'target', label: 'In' },
  output: { type: 'source', label: 'Out' },
  artifact: { type: 'source', label: 'Art' },
};

function HandleConfigurationStory() {
  const [handleConfig, setHandleConfig] = useState<HandleConfigState>(DEFAULT_HANDLE_CONFIG);
  const [showButtons, setShowButtons] = useState(true);
  const [handleTypes, setHandleTypes] = useState<Record<keyof HandleConfigState, HandleTypeOption>>(
    {
      top: 'output',
      right: 'output',
      bottom: 'input',
      left: 'input',
    }
  );

  const updateHandleCount = useCallback(
    (position: keyof HandleConfigState, delta: number) => {
      setHandleConfig((prev) => {
        const handles = [...prev[position]];
        if (delta > 0) {
          const handleType = handleTypes[position];
          const config = HANDLE_TYPE_CONFIG[handleType];
          const isSource = config.type === 'source';
          const newHandle: ButtonHandleConfig = {
            id: `${position}-${Date.now()}`,
            type: config.type,
            handleType,
            label: `${config.label} ${handles.length + 1}`,
            showButton: isSource ? showButtons : undefined,
            onAction: isSource ? handleAction : undefined,
          };
          return { ...prev, [position]: [...handles, newHandle] };
        } else if (handles.length > 0) {
          return { ...prev, [position]: handles.slice(0, -1) };
        }
        return prev;
      });
    },
    [showButtons, handleTypes]
  );

  useEffect(() => {
    setHandleConfig((prev) => ({
      top: prev.top.map((h) => (h.type === 'source' ? { ...h, showButton: showButtons } : h)),
      bottom: prev.bottom.map((h) => (h.type === 'source' ? { ...h, showButton: showButtons } : h)),
      left: prev.left.map((h) => (h.type === 'source' ? { ...h, showButton: showButtons } : h)),
      right: prev.right.map((h) => (h.type === 'source' ? { ...h, showButton: showButtons } : h)),
    }));
  }, [showButtons]);

  const resetConfig = useCallback(() => {
    setHandleConfig(DEFAULT_HANDLE_CONFIG);
    setShowButtons(true);
    setHandleTypes({ top: 'output', right: 'output', bottom: 'input', left: 'input' });
  }, []);

  const nodeTypes = useMemo(() => ({ configurableNode: ConfigurableNode }), []);

  const initialNodes = useMemo(
    () => [
      {
        id: '1',
        type: 'configurableNode',
        position: { x: 350, y: 400 },
        data: { label: 'Configurable Node', handleConfig: DEFAULT_HANDLE_CONFIG, parameters: {} },
      },
    ],
    []
  );

  const { canvasProps, setNodes } = useCanvasStory({ initialNodes });

  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === '1' ? { ...node, data: { ...node.data, handleConfig } } : node
      )
    );
  }, [handleConfig, setNodes]);

  const positions: Array<{ key: keyof HandleConfigState; label: string; icon: string }> = [
    { key: 'top', label: 'Top', icon: 'arrow_upward' },
    { key: 'right', label: 'Right', icon: 'arrow_forward' },
    { key: 'bottom', label: 'Bottom', icon: 'arrow_downward' },
    { key: 'left', label: 'Left', icon: 'arrow_back' },
  ];

  return (
    <BaseCanvas {...canvasProps} nodeTypes={nodeTypes} mode="design">
      <StoryInfoPanel title="Handle configuration" collapsible defaultCollapsed>
        <Column align="start" gap={16} style={{ marginTop: 12 }}>
          <Column gap={8}>
            <ApTypography variant={FontVariantToken.fontSizeSBold}>Handles</ApTypography>
            <Row gap={16} style={{ flexWrap: 'wrap' }}>
              {positions.map(({ key, label, icon }) => (
                <Column key={key} gap={6} align="center">
                  <Row gap={4} align="center">
                    <ApIcon name={icon} size="14px" />
                    <ApTypography variant={FontVariantToken.fontSizeXs}>{label}</ApTypography>
                  </Row>
                  <ApDropdown
                    size="small"
                    selectedValue={handleTypes[key]}
                    onSelectedValueChanged={(e) =>
                      setHandleTypes((prev) => ({ ...prev, [key]: e.detail as HandleTypeOption }))
                    }
                  >
                    <ApDropdownItem value="input" label="Input" />
                    <ApDropdownItem value="output" label="Output" />
                    <ApDropdownItem value="artifact" label="Artifact" />
                  </ApDropdown>
                  <Row gap={2} align="center">
                    <ApIconButton
                      onClick={() => updateHandleCount(key, -1)}
                      disabled={handleConfig[key].length === 0}
                    >
                      <ApIcon name="remove" />
                    </ApIconButton>
                    <ApTypography
                      variant={FontVariantToken.fontSizeMBold}
                      style={{ minWidth: 24, textAlign: 'center' }}
                    >
                      {handleConfig[key].length}
                    </ApTypography>
                    <ApIconButton onClick={() => updateHandleCount(key, 1)}>
                      <ApIcon name="add" />
                    </ApIconButton>
                  </Row>
                </Column>
              ))}
            </Row>
          </Column>

          {/* Show buttons toggle */}
          <ApCheckbox
            label="Show + buttons on outputs"
            checked={showButtons}
            onValueChanged={(e) => setShowButtons(e.detail as boolean)}
          />

          {/* Reset */}
          <ApButton size="small" variant="secondary" label="Reset" onClick={resetConfig} />
        </Column>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

function LogicFlowStory() {
  const logicNodes: Node<BaseNodeData>[] = useMemo(
    () => [
      // IF Node
      createNode({
        id: 'if-node',
        type: 'uipath.control-flow.decision',
        position: { x: 300, y: 200 },
        display: { label: 'If' },
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
          {
            position: Position.Right,
            handles: [
              { id: 'then', type: 'source', handleType: 'output', label: 'Then', showButton: true },
              { id: 'else', type: 'source', handleType: 'output', label: 'Else', showButton: true },
            ],
          },
        ],
      }),

      // SWITCH Node
      createNode({
        id: 'switch-node',
        type: 'uipath.control-flow.switch',
        position: { x: 300, y: 650 },
        display: { label: 'Switch' },
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
          {
            position: Position.Right,
            handles: [
              {
                id: 'default',
                type: 'source',
                handleType: 'output',
                label: 'Default',
                showButton: true,
              },
              { id: 'case-0', type: 'source', handleType: 'output', label: '0', showButton: true },
              { id: 'case-1', type: 'source', handleType: 'output', label: '1', showButton: true },
            ],
          },
        ],
      }),

      // Source nodes
      createNode({
        id: 'condition-input',
        type: 'uipath.blank-node',
        position: { x: 50, y: 200 },
        display: { label: 'Condition', subLabel: 'Boolean' },
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: 'output', type: 'source', handleType: 'output' }],
          },
        ],
      }),

      createNode({
        id: 'value-input',
        type: 'uipath.blank-node',
        position: { x: 50, y: 650 },
        display: { label: 'Value', subLabel: 'Integer' },
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: 'output', type: 'source', handleType: 'output' }],
          },
        ],
      }),

      // Output nodes for IF
      createNode({
        id: 'then-action',
        type: 'uipath.blank-node',
        position: { x: 600, y: 100 },
        display: { label: 'Then Action', subLabel: 'Execute if true', color: 'green' },
      }),

      createNode({
        id: 'else-action',
        type: 'uipath.blank-node',
        position: { x: 600, y: 300 },
        display: { label: 'Else Action', subLabel: 'Execute if false', color: 'red' },
      }),

      // Output nodes for SWITCH
      createNode({
        id: 'default-action',
        type: 'uipath.blank-node',
        position: { x: 600, y: 500 },
        display: { label: 'Default Case', subLabel: 'No match' },
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
        ],
      }),

      createNode({
        id: 'case-0-action',
        type: 'uipath.blank-node',
        position: { x: 600, y: 700 },
        display: { label: 'Case 0', subLabel: 'Value = 0' },
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
        ],
      }),

      createNode({
        id: 'case-1-action',
        type: 'uipath.blank-node',
        position: { x: 600, y: 900 },
        display: { label: 'Case 1', subLabel: 'Value = 1' },
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: 'input', type: 'target', handleType: 'input' }],
          },
        ],
      }),
    ],
    []
  );

  const logicEdges: Edge[] = useMemo(
    () => [
      // IF connections
      {
        id: 'condition-to-if',
        source: 'condition-input',
        sourceHandle: 'output',
        target: 'if-node',
        targetHandle: 'input',
        animated: true,
      },
      {
        id: 'if-to-then',
        source: 'if-node',
        sourceHandle: 'then',
        target: 'then-action',
        targetHandle: 'input',
        style: { stroke: 'green' },
      },
      {
        id: 'if-to-else',
        source: 'if-node',
        sourceHandle: 'else',
        target: 'else-action',
        targetHandle: 'input',
        style: { stroke: 'orange' },
      },
      // SWITCH connections
      {
        id: 'value-to-switch',
        source: 'value-input',
        sourceHandle: 'output',
        target: 'switch-node',
        targetHandle: 'input',
        animated: true,
      },
      {
        id: 'switch-to-default',
        source: 'switch-node',
        sourceHandle: 'default',
        target: 'default-action',
        targetHandle: 'input',
      },
      {
        id: 'switch-to-0',
        source: 'switch-node',
        sourceHandle: 'case-0',
        target: 'case-0-action',
        targetHandle: 'input',
        style: { stroke: 'blue' },
      },
      {
        id: 'switch-to-1',
        source: 'switch-node',
        sourceHandle: 'case-1',
        target: 'case-1-action',
        targetHandle: 'input',
        style: { stroke: 'purple' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes: logicNodes, initialEdges: logicEdges });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel
        title="Logic Flow Examples"
        description="IF and SWITCH nodes with ButtonHandles"
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  name: 'Default',
  args: { handles: [], position: Position.Top },
  render: () => <DefaultStory />,
};

export const HandleConfiguration: Story = {
  name: 'Handle configuration',
  args: { handles: [], position: Position.Top },
  render: () => <HandleConfigurationStory />,
};

export const LogicFlow: Story = {
  name: 'Logic flow',
  render: () => <LogicFlowStory />,
};
