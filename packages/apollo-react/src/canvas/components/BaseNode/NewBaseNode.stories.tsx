import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useMemo } from 'react';
import type { Connection, NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { NewBaseNode } from './NewBaseNode';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { NewBaseNodeData, NewBaseNodeDisplayProps } from './NewBaseNode.types';
import type { HandleActionEvent } from '../ButtonHandle';
import { Icons } from '@uipath/uix/core';
import { ApIcon, ApTypography } from '@uipath/portal-shell-react';
import { FontVariantToken } from '@uipath/apollo-core';
import { DefaultCanvasTranslations } from '../../types';

const meta = {
  title: 'Canvas/NewBaseNode',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
} satisfies Meta<NewBaseNodeData & NewBaseNodeDisplayProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Custom node component that extracts display props from data for stories
const StoryBaseNode = (props: any) => {
  const { data, ...nodeProps } = props;
  return (
    <NewBaseNode
      {...nodeProps}
      data={data}
      icon={data?.icon}
      display={data?.display}
      adornments={data?.adornments}
      handleConfigurations={data?.handleConfigurations}
      onHandleAction={data?.onHandleAction}
    />
  );
};

const nodeTypes: NodeTypes = {
  newBaseNode: StoryBaseNode,
};

export const Default: Story = {
  render: () => {
    const DefaultComponent = () => {
      const [nodes, __setNodes, onNodesChange] = useNodesState([
        {
          id: '1',
          type: 'newBaseNode',
          position: { x: 200, y: 200 },
          data: {},
        },
        {
          id: '2',
          type: 'newBaseNode',
          position: { x: 400, y: 200 },
          data: {},
        },
        {
          id: '3',
          type: 'newBaseNode',
          position: { x: 600, y: 200 },
          data: {},
        },
        {
          id: '5',
          type: 'newBaseNode',
          position: { x: 200, y: 400 },
          data: {},
        },
        {
          id: '6',
          type: 'newBaseNode',
          position: { x: 200, y: 600 },
          data: {},
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
      );

      const enhancedNodes = useMemo(
        () =>
          nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              // Move props into data for the StoryBaseNode to extract
              display:
                node.id === '1'
                  ? { label: 'http-request', shape: 'square' as const }
                  : node.id === '2'
                    ? { label: 'script-task', shape: 'square' as const }
                    : node.id === '3'
                      ? { label: 'rpa', shape: 'square' as const }
                      : node.id === '5'
                        ? { label: 'agent', shape: 'rectangle' as const }
                        : node.id === '6'
                          ? { label: 'generic-node', shape: 'square' as const }
                          : undefined,
              icon:
                node.id === '1' ? (
                  <ApIcon name="public" color="var(--uix-canvas-foreground-de-emp)" size="40px" />
                ) : node.id === '2' ? (
                  <ApIcon name="code" color="var(--uix-canvas-foreground-de-emp)" size="40px" />
                ) : node.id === '3' ? (
                  <ApIcon name="list_alt" color="var(--uix-canvas-foreground-de-emp)" size="40px" />
                ) : node.id === '5' ? (
                  <div style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === '6' ? (
                  <ApIcon name="settings" color="var(--uix-canvas-foreground-de-emp)" size="40px" />
                ) : undefined,
              // Add adornments
              adornments:
                node.id === '1'
                  ? {
                      bottomLeft: (
                        <ApTypography variant={FontVariantToken.fontMonoXS}>GET</ApTypography>
                      ),
                    }
                  : node.id === '2'
                    ? {
                        topRight: (
                          <div
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              borderRadius: '3px',
                            }}
                          >
                            JAVASCRIPT
                          </div>
                        ),
                      }
                    : node.id === '3'
                      ? {
                          bottomLeft: (
                            <div
                              style={{
                                fontSize: '8px',
                                padding: '1px 2px',
                                backgroundColor: '#F97316',
                                color: 'white',
                                borderRadius: '3px',
                              }}
                            >
                              UIPATH
                            </div>
                          ),
                        }
                      : undefined,
              handleConfigurations:
                node.id === '5'
                  ? [
                      {
                        position: Position.Left,
                        handles: [
                          {
                            id: 'input',
                            type: 'target',
                            handleType: 'input',
                          },
                        ],
                      },
                      {
                        position: Position.Right,
                        handles: [
                          {
                            id: 'output',
                            type: 'source',
                            handleType: 'output',
                          },
                        ],
                      },
                      {
                        position: Position.Top,
                        handles: [
                          {
                            id: 'memorySpace',
                            type: 'source',
                            handleType: 'artifact',
                            label: 'Memory',
                          },
                          {
                            id: 'context',
                            type: 'source',
                            handleType: 'artifact',
                            label: 'Context',
                          },
                        ],
                      },
                      {
                        position: Position.Bottom,
                        handles: [
                          {
                            id: 'model',
                            type: 'source',
                            handleType: 'artifact',
                            label: 'Model',
                          },
                          {
                            id: 'escalation',
                            type: 'source',
                            handleType: 'artifact',
                            label: 'Escalations',
                          },
                          {
                            id: 'tool',
                            type: 'source',
                            handleType: 'artifact',
                            label: 'Tools',
                          },
                        ],
                      },
                    ]
                  : [
                      // Other nodes: Simple handle configuration
                      {
                        position: Position.Left,
                        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
                      },
                      {
                        position: Position.Right,
                        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
                      },
                    ],
              onHandleAction: (event: HandleActionEvent) => {
                console.log('Handle action:', event);
              },
            },
          })) as any[],
        [nodes]
      );

      return (
        <BaseCanvas
          nodes={enhancedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          mode="design"
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
          </Panel>
        </BaseCanvas>
      );
    };
    return <DefaultComponent />;
  },
};

export const CustomizedSizes: Story = {
  render: () => {
    const CustomizedSizesComponent = () => {
      const [nodes, __setNodes, onNodesChange] = useNodesState([
        // Square shapes - various sizes
        {
          id: 'sq2',
          type: 'newBaseNode',
          width: 40,
          height: 40,
          position: { x: 100, y: 50 },
          data: {},
        },
        {
          id: 'sq3',
          type: 'newBaseNode',
          width: 60,
          height: 60,
          position: { x: 170, y: 50 },
          data: {},
        },
        {
          id: 'sq4',
          type: 'newBaseNode',
          width: 80,
          height: 80,
          position: { x: 260, y: 50 },
          data: {},
        },
        {
          id: 'sq5',
          type: 'newBaseNode',
          width: 100,
          height: 100,
          position: { x: 370, y: 50 },
          data: {},
        },
        {
          id: 'sq6',
          type: 'newBaseNode',
          width: 120,
          height: 120,
          position: { x: 500, y: 50 },
          data: {},
        },
        {
          id: 'sq7',
          type: 'newBaseNode',
          width: 150,
          height: 150,
          position: { x: 650, y: 50 },
          data: {},
        },

        // Circle shapes - various sizes
        {
          id: 'c2',
          type: 'newBaseNode',
          width: 40,
          height: 40,
          position: { x: 100, y: 250 },
          data: {},
        },
        {
          id: 'c3',
          type: 'newBaseNode',
          width: 60,
          height: 60,
          position: { x: 170, y: 250 },
          data: {},
        },
        {
          id: 'c4',
          type: 'newBaseNode',
          width: 80,
          height: 80,
          position: { x: 260, y: 250 },
          data: {},
        },
        {
          id: 'c5',
          type: 'newBaseNode',
          width: 100,
          height: 100,
          position: { x: 370, y: 250 },
          data: {},
        },
        {
          id: 'c6',
          type: 'newBaseNode',
          width: 120,
          height: 120,
          position: { x: 500, y: 250 },
          data: {},
        },
        {
          id: 'c7',
          type: 'newBaseNode',
          width: 150,
          height: 150,
          position: { x: 650, y: 250 },
          data: {},
        },

        // Rectangle shapes - various sizes
        {
          id: 'r1',
          type: 'newBaseNode',
          width: 100,
          height: 40,
          position: { x: 50, y: 450 },
          data: {},
        },
        {
          id: 'r2',
          type: 'newBaseNode',
          width: 150,
          height: 60,
          position: { x: 180, y: 450 },
          data: {},
        },
        {
          id: 'r3',
          type: 'newBaseNode',
          width: 200,
          height: 80,
          position: { x: 360, y: 450 },
          data: {},
        },
        {
          id: 'r4',
          type: 'newBaseNode',
          width: 250,
          height: 100,
          position: { x: 50, y: 550 },
          data: {},
        },
        {
          id: 'r5',
          type: 'newBaseNode',
          width: 320,
          height: 120,
          position: { x: 330, y: 550 },
          data: {},
        },
        {
          id: 'r6',
          type: 'newBaseNode',
          width: 400,
          height: 150,
          position: { x: 50, y: 700 },
          data: {},
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      const onConnect = useCallback(
        (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
      );

      const enhancedNodes = useMemo(
        () =>
          nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              // Move props into data for the StoryBaseNode to extract
              display:
                node.id === 'sq2'
                  ? {
                      label: '40x40',
                      shape: 'square' as const,
                      background: '#fff3e0',
                      iconBackground: '#f57c00',
                      iconColor: '#ffffff',
                    }
                  : node.id === 'sq3'
                    ? {
                        label: '60x60',
                        shape: 'square' as const,
                        background: '#f3e5f5',
                        iconBackground: '#7b1fa2',
                        iconColor: '#ffeb3b',
                      }
                    : node.id === 'sq4'
                      ? {
                          label: '80x80',
                          shape: 'square' as const,
                          background: '#e8f5e9',
                          iconBackground: '#388e3c',
                          iconColor: '#ffffff',
                        }
                      : node.id === 'sq5'
                        ? {
                            label: '100x100',
                            shape: 'square' as const,
                            background: '#fce4ec',
                            iconBackground: '#c2185b',
                            iconColor: '#ffe0b2',
                          }
                        : node.id === 'sq6'
                          ? {
                              label: '120x120',
                              shape: 'square' as const,
                              background: '#e0f2f1',
                              iconBackground: '#00695c',
                              iconColor: '#b2dfdb',
                            }
                          : node.id === 'sq7'
                            ? {
                                label: '150x150',
                                shape: 'square' as const,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                iconBackground: 'rgba(255, 255, 255, 0.9)',
                                iconColor: '#764ba2',
                              }
                            : node.id === 'c2'
                              ? {
                                  label: '40x40',
                                  shape: 'circle' as const,
                                  background: '#e8eaf6',
                                  iconBackground: '#283593',
                                  iconColor: '#e3f2fd',
                                }
                              : node.id === 'c3'
                                ? {
                                    label: '60x60',
                                    shape: 'circle' as const,
                                    background: '#fff8e1',
                                    iconBackground: '#f57f17',
                                    iconColor: '#311b92',
                                  }
                                : node.id === 'c4'
                                  ? {
                                      label: '80x80',
                                      shape: 'circle' as const,
                                      background: '#e1f5fe',
                                      iconBackground: '#0277bd',
                                      iconColor: '#ffecb3',
                                    }
                                  : node.id === 'c5'
                                    ? {
                                        label: '100x100',
                                        shape: 'circle' as const,
                                        background: '#f3e5f5',
                                        iconBackground: '#6a1b9a',
                                        iconColor: '#e1bee7',
                                      }
                                    : node.id === 'c6'
                                      ? {
                                          label: '120x120',
                                          shape: 'circle' as const,
                                          background: '#efebe9',
                                          iconBackground: '#4e342e',
                                          iconColor: '#d7ccc8',
                                        }
                                      : node.id === 'c7'
                                        ? {
                                            label: '150x150',
                                            shape: 'circle' as const,
                                            background:
                                              'radial-gradient(circle at center, #ff6b6b 0%, #ff4757 100%)',
                                            iconBackground: 'rgba(255, 255, 255, 0.95)',
                                            iconColor: '#ff4757',
                                          }
                                        : node.id === 'r1'
                                          ? {
                                              label: '100x40',
                                              shape: 'rectangle' as const,
                                              background: '#e8f5e9',
                                              iconBackground: '#2e7d32',
                                              iconColor: '#a5d6a7',
                                            }
                                          : node.id === 'r2'
                                            ? {
                                                label: '150x60',
                                                shape: 'rectangle' as const,
                                                background: '#fff3e0',
                                                iconBackground: '#e65100',
                                                iconColor: '#fff176',
                                              }
                                            : node.id === 'r3'
                                              ? {
                                                  label: '200x80',
                                                  shape: 'rectangle' as const,
                                                  background: '#fce4ec',
                                                  iconBackground: '#ad1457',
                                                  iconColor: '#f8bbd0',
                                                }
                                              : node.id === 'r4'
                                                ? {
                                                    label: '250x100',
                                                    shape: 'rectangle' as const,
                                                    background: '#e0f7fa',
                                                    iconBackground: '#00838f',
                                                    iconColor: '#84ffff',
                                                  }
                                                : node.id === 'r5'
                                                  ? {
                                                      label: '320x120',
                                                      shape: 'rectangle' as const,
                                                      background: '#f3e5f5',
                                                      iconBackground: '#4a148c',
                                                      iconColor: '#ea80fc',
                                                    }
                                                  : node.id === 'r6'
                                                    ? {
                                                        label: '400x150',
                                                        shape: 'rectangle' as const,
                                                        background:
                                                          'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                                                        iconBackground: 'rgba(255, 255, 255, 0.9)',
                                                        iconColor: '#0091ea',
                                                      }
                                                    : undefined,
              icon:
                node.id === 'sq2' ? (
                  // script-task nodes
                  <ApIcon name="code" color="#ffffff" size="40px" />
                ) : node.id === 'sq3' ? (
                  // rpa nodes
                  <ApIcon name="list_alt" color="#ffeb3b" size="40px" />
                ) : node.id === 'sq4' ? (
                  // connector nodes
                  <ApIcon name="code" color="#ffffff" size="40px" />
                ) : node.id === 'sq5' ? (
                  // generic nodes
                  <ApIcon name="circle" color="#ffe0b2" size="40px" />
                ) : node.id === 'sq6' ? (
                  // http-request nodes
                  <ApIcon name="public" color="#b2dfdb" size="40px" />
                ) : node.id === 'sq7' ? (
                  // script-task nodes
                  <ApIcon name="code" color="#764ba2" size="40px" />
                ) : node.id === 'c2' ? (
                  // script-task nodes
                  <ApIcon name="code" color="#e3f2fd" size="40px" />
                ) : node.id === 'c3' ? (
                  // rpa nodes
                  <ApIcon name="list_alt" color="#311b92" size="40px" />
                ) : node.id === 'c4' ? (
                  // connector nodes
                  <ApIcon name="code" color="#ffecb3" size="40px" />
                ) : node.id === 'c5' ? (
                  // generic nodes
                  <ApIcon name="circle" color="#e1bee7" size="40px" />
                ) : node.id === 'c6' ? (
                  // http-request nodes
                  <ApIcon name="public" color="#d7ccc8" size="40px" />
                ) : node.id === 'c7' ? (
                  // script-task nodes
                  <ApIcon name="code" color="#ff4757" size="40px" />
                ) : node.id === 'r1' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#a5d6a7' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === 'r2' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#fff176' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === 'r3' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#f8bbd0' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === 'r4' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#84ffff' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === 'r5' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#ea80fc' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : node.id === 'r6' ? (
                  // agent nodes (rectangles)
                  <div style={{ color: '#0091ea' }}>
                    <Icons.AgentIcon />
                  </div>
                ) : (
                  <ApIcon name="public" color="var(--uix-canvas-foreground-de-emp)" size="40px" />
                ),
              // Add adornments
              adornments:
                node.id === 'sq2' || node.id === 'sq7' || node.id === 'c2' || node.id === 'c7'
                  ? {
                      topRight: (
                        <div
                          style={{
                            fontSize: '10px',
                            padding: '2px 4px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            borderRadius: '3px',
                          }}
                        >
                          JAVASCRIPT
                        </div>
                      ),
                    }
                  : node.id === 'sq3' || node.id === 'c3'
                    ? {
                        bottomLeft: (
                          <div
                            style={{
                              fontSize: '8px',
                              padding: '1px 2px',
                              backgroundColor: '#F97316',
                              color: 'white',
                              borderRadius: '3px',
                            }}
                          >
                            UIPATH
                          </div>
                        ),
                      }
                    : node.id === 'sq6' || node.id === 'c6'
                      ? {
                          bottomLeft: (
                            <ApTypography variant={FontVariantToken.fontMonoXS}>GET</ApTypography>
                          ),
                        }
                      : undefined,
            },
          })) as any[],
        [nodes]
      );

      return (
        <BaseCanvas
          nodes={enhancedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          mode="design"
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
          </Panel>
        </BaseCanvas>
      );
    };
    return <CustomizedSizesComponent />;
  },
};
