/**
 * Storybook decorators for canvas stories.
 *
 * Provides reusable decorators to reduce boilerplate in story files.
 */
import React, { useMemo } from 'react';
import type { Decorator } from '@storybook/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type {
  ExecutionStateContextValue,
  NodeExecutionState,
} from '../components/BaseNode/ExecutionStatusContext';
import { ExecutionStatusContext } from '../components/BaseNode/ExecutionStatusContext';
import { NodeRegistryProvider } from '../components/BaseNode/NodeRegistryProvider';
import { allNodeManifests, createNodesFromManifests } from './manifests';

/**
 * Props for execution state configuration.
 * Re-export the context value type for convenience.
 */
export type ExecutionStateConfig = ExecutionStateContextValue;

/**
 * Props for the canvas providers decorator.
 */
export interface CanvasProvidersOptions {
  /**
   * Execution state configuration.
   */
  executionState?: ExecutionStateConfig;

  /**
   * Whether to wrap content in a fullscreen container.
   * @default true
   */
  fullscreen?: boolean;

  /**
   * Custom container styles (only applies when fullscreen is true).
   */
  containerStyle?: React.CSSProperties;
}

/**
 * Default execution state that extracts status from node ID.
 * Node IDs like "node-InProgress" will return "InProgress" as the status.
 */
const defaultExecutionState: ExecutionStateConfig = {
  getExecutionState: (nodeId: string): NodeExecutionState | undefined => nodeId.split('-')[1],
};

/**
 * Fullscreen container component.
 */
const FullscreenContainer = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      height: '100vh',
      width: '100vw',
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Creates a decorator that wraps stories with canvas providers.
 *
 * This decorator sets up:
 * - NodeRegistryProvider with specified registrations
 * - ExecutionStatusContext for node execution states
 * - ReactFlowProvider for React Flow functionality
 * - Optional fullscreen container
 *
 * @example
 * ```tsx
 * // Use all registrations with defaults
 * decorators: [withCanvasProviders()]
 *
 * // Use a specific preset
 * decorators: [withCanvasProviders({ registrations: 'agent' })]
 *
 * // Use custom registrations
 * decorators: [withCanvasProviders({ registrations: [myCustomRegistration] })]
 *
 * // Disable fullscreen container
 * decorators: [withCanvasProviders({ fullscreen: false })]
 * ```
 */
export function withCanvasProviders(options: CanvasProvidersOptions = {}): Decorator {
  const { executionState = defaultExecutionState, fullscreen = true, containerStyle } = options;

  return function CanvasProvidersDecorator(Story) {
    const registrations = useMemo(() => createNodesFromManifests(allNodeManifests), []);
    const executions = useMemo(() => executionState, []);

    const content = (
      <NodeRegistryProvider registrations={registrations}>
        <ExecutionStatusContext.Provider value={executions}>
          <ReactFlowProvider>
            <Story />
          </ReactFlowProvider>
        </ExecutionStatusContext.Provider>
      </NodeRegistryProvider>
    );

    if (fullscreen) {
      return <FullscreenContainer style={containerStyle}>{content}</FullscreenContainer>;
    }

    return content;
  };
}

/**
 * Creates a decorator that wraps stories in a fullscreen container.
 *
 * @example
 * ```tsx
 * decorators: [withFullscreen()]
 *
 * // With custom styles
 * decorators: [withFullscreen({ backgroundColor: '#f5f5f5' })]
 * ```
 */
export function withFullscreen(style?: React.CSSProperties): Decorator {
  return function FullscreenDecorator(Story) {
    return (
      <FullscreenContainer style={style}>
        <Story />
      </FullscreenContainer>
    );
  };
}
