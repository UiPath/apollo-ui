import type { Meta, StoryObj } from '@storybook/react';
import { ApSankeyDiagram } from './ApSankeyDiagram';
import token from '@uipath/apollo-core';

const meta: Meta<typeof ApSankeyDiagram> = {
  title: 'Visualizations/ApSankeyDiagram',
  component: ApSankeyDiagram,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ApSankeyDiagram>;

/**
 * Simple example showing basic job flow from start to end
 */
export const Simple: Story = {
  args: {
    data: {
      nodes: [
        { id: 'start', label: 'All traces' },
        { id: 'successful', label: 'Successful' },
        { id: 'failed', label: 'Faulted' },
      ],
      links: [
        { source: 'start', target: 'successful', value: 80 },
        { source: 'start', target: 'failed', value: 20 },
      ],
    },
    height: 300,
    width: 600,
  },
};

/**
 * Job flow example
 */
export const JobFlow: Story = {
  args: {
    data: {
      nodes: [
        { id: 'all_traces', label: 'All traces' },
        { id: 'api_call', label: 'API Call' },
        { id: 'context', label: 'Context' },
        { id: 'memory', label: 'Memory' },
        { id: 'guardrails', label: 'Guardrails' },
        { id: 'escalation', label: 'Escalation' },
        { id: 'Web Search', label: 'Web Search' },
        { id: 'successful', label: 'Successful', color: token.Colors.ColorSuccess500 },
        { id: 'faulted', label: 'Faulted', color: token.Colors.ColorError500 },
      ],
      links: [
        { source: 'all_traces', target: 'api_call', value: 6, metadata: { 'Total jobs': 6, 'P95 latency': '10s', 'Agent units': '15' } },
        { source: 'all_traces', target: 'context', value: 3, metadata: { 'Total jobs': 3, 'P95 latency': '10s', 'Agent units': '18' } },
        { source: 'api_call', target: 'memory', value: 2 },
        { source: 'api_call', target: 'guardrails', value: 2, metadata: { 'Total jobs': 4, 'P95 latency': '10s', 'Agent units': '14' } },
        { source: 'api_call', target: 'escalation', value: 1, metadata: { 'Total jobs': 3, 'P95 latency': '10s', 'Agent units': '55' } },
        { source: 'api_call', target: 'Web Search', value: 1, metadata: { 'Total jobs': 2, 'P95 latency': '10s', 'Agent units': '25' } },
        { source: 'context', target: 'guardrails', value: 2 },
        { source: 'context', target: 'Web Search', value: 1 },
        { source: 'memory', target: 'successful', value: 1 },
        { source: 'memory', target: 'faulted', value: 1 },
        { source: 'guardrails', target: 'successful', value: 3 },
        { source: 'guardrails', target: 'faulted', value: 1 },
        { source: 'escalation', target: 'faulted', value: 1 },
        { source: 'Web Search', target: 'successful', value: 1 },
        { source: 'Web Search', target: 'faulted', value: 1 },
      ],
    },
    height: 800,
    width: 1200,
  },
};

/**
 * Example with custom colors for nodes
 */
export const CustomColors: Story = {
  args: {
    data: {
      nodes: [
        { id: 'source', label: 'Source', color: '#FF6B6B' },
        { id: 'process1', label: 'Process 1', color: '#4ECDC4' },
        { id: 'process2', label: 'Process 2', color: '#45B7D1' },
        { id: 'output', label: 'Output', color: '#96CEB4' },
      ],
      links: [
        { source: 'source', target: 'process1', value: 60 },
        { source: 'source', target: 'process2', value: 40 },
        { source: 'process1', target: 'output', value: 50 },
        { source: 'process2', target: 'output', value: 35 },
      ],
    },
    height: 400,
    width: 700,
  },
};

/**
 * Multi-stage flow with complex branching
 */
export const ComplexFlow: Story = {
  args: {
    data: {
      nodes: [
        { id: 'input', label: 'Input' },
        { id: 'stage1a', label: 'Stage 1A' },
        { id: 'stage1b', label: 'Stage 1B' },
        { id: 'stage2a', label: 'Stage 2A' },
        { id: 'stage2b', label: 'Stage 2B' },
        { id: 'stage2c', label: 'Stage 2C' },
        { id: 'output1', label: 'Output 1' },
        { id: 'output2', label: 'Output 2' },
      ],
      links: [
        { source: 'input', target: 'stage1a', value: 100 },
        { source: 'input', target: 'stage1b', value: 80 },
        { source: 'stage1a', target: 'stage2a', value: 60 },
        { source: 'stage1a', target: 'stage2b', value: 40 },
        { source: 'stage1b', target: 'stage2b', value: 50 },
        { source: 'stage1b', target: 'stage2c', value: 30 },
        { source: 'stage2a', target: 'output1', value: 55 },
        { source: 'stage2b', target: 'output1', value: 45 },
        { source: 'stage2b', target: 'output2', value: 20 },
        { source: 'stage2c', target: 'output2', value: 25 },
      ],
    },
    height: 500,
    width: 900,
  },
};

/**
 * Example with interaction callbacks
 */
export const WithInteractions: Story = {
  args: {
    data: {
      nodes: [
        { id: 'a', label: 'Node A' },
        { id: 'b', label: 'Node B' },
        { id: 'c', label: 'Node C' },
      ],
      links: [
        { source: 'a', target: 'b', value: 10 },
        { source: 'b', target: 'c', value: 5 },
      ],
    },
    height: 300,
    width: 600,
    onNodeClick: (node, _) => {
      alert(`Clicked node: ${node.label}`);
    },
    onLinkClick: (link, _) => {
      alert(`Clicked link from ${link.source} to ${link.target} (value: ${link.value})`);
    },
  },
};

/**
 * Compact version with custom node width and padding
 */
export const Compact: Story = {
  args: {
    data: {
      nodes: [
        { id: '1', label: 'Start' },
        { id: '2', label: 'Middle' },
        { id: '3', label: 'End' },
      ],
      links: [
        { source: '1', target: '2', value: 15 },
        { source: '2', target: '3', value: 10 },
      ],
    },
    height: 250,
    width: 500,
    nodeWidth: 16,
    nodePadding: 8,
  },
};

/**
 * Full width responsive example
 */
export const FullWidth: Story = {
  args: {
    data: {
      nodes: [
        { id: 'start', label: 'Start' },
        { id: 'mid1', label: 'Process A' },
        { id: 'mid2', label: 'Process B' },
        { id: 'end', label: 'End' },
      ],
      links: [
        { source: 'start', target: 'mid1', value: 70 },
        { source: 'start', target: 'mid2', value: 30 },
        { source: 'mid1', target: 'end', value: 60 },
        { source: 'mid2', target: 'end', value: 25 },
      ],
    },
    height: 400,
    width: '100%',
  },
};
