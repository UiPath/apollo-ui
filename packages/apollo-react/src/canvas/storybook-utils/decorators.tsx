/**
 * Storybook decorators for canvas stories.
 *
 * Provides reusable decorators to reduce boilerplate in story files.
 */

import type { Decorator } from '@storybook/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { useMemo } from 'react';
import { NodeRegistryProvider } from '../components/BaseNode/NodeRegistryProvider';
import {
  type ExecutionStateContextValue,
  ExecutionStatusContext,
  type ValidationStateContextValue,
  ValidationStatusContext,
} from '../hooks';
import type { ElementStatus } from '../types/execution';
import type { ValidationErrorSeverity } from '../types/validation';
import { allNodeManifests } from './manifests';

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
   * Validation state configuration.
   */
  validationState?: ValidationStateContextValue;

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
 * Node/Edge IDs like "node-InProgress" will return "InProgress" as the status.
 */
const defaultExecutionState: ExecutionStateConfig = {
  getNodeExecutionState: (nodeId: string): ElementStatus | undefined =>
    nodeId.split('-')[1] as ElementStatus,
  getEdgeExecutionState: (edgeId: string, _targetNodeId: string): ElementStatus | undefined =>
    edgeId.split('-')[1] as ElementStatus,
};

/**
 * Default validation state that extracts status from node ID.
 * Node/Edge IDs like "node-InProgress-ERROR" will return "ERROR" as the status.
 */
const defaultValidationStateContext: ValidationStateContextValue = {
  getElementValidationState: (nodeId: string) => ({
    validationStatus: nodeId.split('-')[2] as ValidationErrorSeverity,
    validationError: undefined,
  }),
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
  const {
    executionState = defaultExecutionState,
    validationState = defaultValidationStateContext,
    fullscreen = true,
    containerStyle,
  } = options;

  return function CanvasProvidersDecorator(Story) {
    const manifests = useMemo(() => allNodeManifests, []);
    const executions = useMemo(() => executionState, []);
    const validations = useMemo(() => validationState, []);

    const content = (
      <NodeRegistryProvider registrations={manifests}>
        <ExecutionStatusContext.Provider value={executions}>
          <ValidationStatusContext.Provider value={validations}>
            <ReactFlowProvider>
              <Story />
            </ReactFlowProvider>
          </ValidationStatusContext.Provider>
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
