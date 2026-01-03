import type React from 'react';

// Type definitions for tool call spans
export interface TSpan {
  id?: string;
  name?: string;
  status?: 'unset' | 'ok' | 'error';
  startTime?: string;
  endTime?: string;
  attributes?: Record<string, any> | string;
}

export interface ITreeNode<T = any> {
  key: string;
  name: string;
  data: T;
  children?: ITreeNode<T>[];
}

export interface ApToolCallProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Span data containing tool call execution information */
  span?: ITreeNode<TSpan>;
  /** Name of the tool being called */
  toolName?: string;
  /** Input parameters for the tool call */
  input?: Record<string, any>;
  /** Output data from the tool call */
  output?: Record<string, any>;
  /** Whether the tool call resulted in an error */
  isError?: boolean;
  /** Start time of the tool call */
  startTime?: string;
  /** End time of the tool call */
  endTime?: string;
}

export type ToolCallSectionType = 'input' | 'output' | 'execution' | 'errors' | 'escalation';

export interface ToolCallSectionProps {
  type: ToolCallSectionType;
  title: string;
  isExpanded: boolean | undefined;
  onToggle: () => void;
  data?: Record<string, unknown>;
  children?: React.ReactNode;
}

export interface NestedValueProps {
  value: unknown;
  depth?: number;
}
