import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactFlowProvider } from "@uipath/uix/xyflow/react";
import { Row } from "@uipath/uix/core";
import { TimelinePlayer } from "./TimelinePlayer";
import { AgentFlow } from "../AgentFlow";
import type { IRawSpan } from "@uipath/portal-shell-react";
import { ProjectType, type AgentFlowResource, type AgentFlowResourceNodeData, type AgentFlowResourceType } from "../../../types";

const meta: Meta<typeof TimelinePlayer> = {
  title: "Canvas/TimelinePlayer",
  component: TimelinePlayer,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "var(--uix-canvas-background)",
          color: "var(--uix-canvas-foreground)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimelinePlayer>;

// Mock IRawSpan data for realistic timeline scenarios
const createMockSpan = (
  id: string,
  parentId: string | undefined,
  spanType: string,
  name: string,
  startTime: string,
  endTime: string,
  status?: number,
  updatedAt?: string
): IRawSpan =>
  ({
    Id: id,
    ParentId: parentId,
    SpanType: spanType,
    Name: name,
    StartTime: startTime,
    EndTime: endTime,
    Status: status,
    UpdatedAt: updatedAt || startTime,
    Attributes: JSON.stringify({ type: spanType }),
  }) as IRawSpan;

// Generate realistic timestamps
const baseTime = new Date("2024-01-15T10:00:00.000Z");
const createTimestamp = (offsetMs: number): string => new Date(baseTime.getTime() + offsetMs).toISOString();

// Sample spans representing a typical agent execution
const sampleSpans: IRawSpan[] = [
  // Main agent run
  createMockSpan(
    "agent-run-1",
    undefined,
    "agentRun",
    "Process Insurance Claim",
    createTimestamp(0),
    createTimestamp(45000), // 45 seconds total
    1 // Success status
  ),

  // Child spans under the agent run
  createMockSpan("context-load-1", "agent-run-1", "contextLoad", "Load User Profile", createTimestamp(100), createTimestamp(2500), 1),

  createMockSpan("tool-call-1", "agent-run-1", "toolCall", "Validate Claim Data", createTimestamp(2500), createTimestamp(8000), 1),

  createMockSpan(
    "completion-1",
    "agent-run-1",
    "completion",
    "Generate Initial Response",
    createTimestamp(8000),
    createTimestamp(12000),
    1
  ),

  createMockSpan("tool-call-2", "agent-run-1", "toolCall", "Check Policy Status", createTimestamp(12000), createTimestamp(20000), 2), // Error status

  createMockSpan("tool-call-3", "agent-run-1", "toolCall", "Calculate Payout Amount", createTimestamp(20000), createTimestamp(28000), 1),

  createMockSpan(
    "escalation-1",
    "agent-run-1",
    "escalation",
    "Manager Approval Required",
    createTimestamp(28100),
    createTimestamp(44000),
    1
  ),
];

// Shorter timeline for quick interactions
const shortSpans: IRawSpan[] = [
  createMockSpan("agent-run-short", undefined, "agentRun", "Quick Query Response", createTimestamp(0), createTimestamp(8000), 1),

  createMockSpan(
    "context-load-short",
    "agent-run-short",
    "contextLoad",
    "Load Session Context",
    createTimestamp(100),
    createTimestamp(1000),
    1
  ),

  createMockSpan("completion-short", "agent-run-short", "completion", "Generate Response", createTimestamp(1000), createTimestamp(7500), 1),
];

// Complex nested timeline with multiple tools and escalations
const complexSpans: IRawSpan[] = [
  createMockSpan(
    "agent-run-complex",
    undefined,
    "agentRun",
    "Multi-step Document Processing",
    createTimestamp(0),
    createTimestamp(120000), // 2 minutes
    1
  ),

  // First phase - document analysis
  createMockSpan("tool-doc-parse", "agent-run-complex", "toolCall", "Parse PDF Document", createTimestamp(500), createTimestamp(15000), 1),

  createMockSpan("tool-ocr", "agent-run-complex", "toolCall", "OCR Text Extraction", createTimestamp(15000), createTimestamp(35000), 2), // OCR failed

  // Second phase - data validation
  createMockSpan(
    "tool-validate",
    "agent-run-complex",
    "toolCall",
    "Validate Extracted Data",
    createTimestamp(35000),
    createTimestamp(48000),
    1
  ),

  createMockSpan(
    "completion-validation",
    "agent-run-complex",
    "completion",
    "Validation Results",
    createTimestamp(48000),
    createTimestamp(56000),
    1
  ),

  // Third phase - external API calls
  createMockSpan(
    "tool-api-1",
    "agent-run-complex",
    "toolCall",
    "Check Customer Database",
    createTimestamp(56000),
    createTimestamp(68000),
    1
  ),

  createMockSpan("tool-api-2", "agent-run-complex", "toolCall", "Verify Identity", createTimestamp(68000), createTimestamp(82000), 2), // Identity verification failed

  // Fourth phase - decision making
  createMockSpan(
    "completion-decision",
    "agent-run-complex",
    "completion",
    "Process Decision Logic",
    createTimestamp(83000),
    createTimestamp(95000),
    1
  ),

  // Final phase - output generation
  createMockSpan(
    "tool-email",
    "agent-run-complex",
    "toolCall",
    "Send Notification Email",
    createTimestamp(96000),
    createTimestamp(105000),
    1
  ),

  createMockSpan("tool-database", "agent-run-complex", "toolCall", "Update Records", createTimestamp(106000), createTimestamp(115000), 1),

  createMockSpan(
    "completion-final",
    "agent-run-complex",
    "completion",
    "Generate Final Report",
    createTimestamp(116000),
    createTimestamp(119000),
    1
  ),
];

const sampleResources: AgentFlowResource[] = [
  {
    id: "context-load-short",
    type: "context",
    name: "Load Session Context",
    description: "Current session information",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
  },
  {
    id: "completion-short",
    type: "tool",
    name: "Generate Response",
    description: "AI completion generation",
    iconUrl: "",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
  },
];

const sampleDefinition = {
  name: "Quick Query Agent",
  version: "1.0",
  settings: {
    model: "gpt-4",
    engine: "openai",
  },
  tools: [],
  resources: [],
};

// AgentFlow + TimelinePlayer integrated wrapper
interface AgentFlowWithTimelineProps {
  spans: IRawSpan[];
  enableTimelinePlayer?: boolean;
  activeResourceIds?: string[];
}

const AgentFlowWithTimeline = ({ spans, enableTimelinePlayer = true, activeResourceIds = [] }: AgentFlowWithTimelineProps) => {
  const [resources] = useState<AgentFlowResource[]>(sampleResources);
  const [_selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
  }, []);

  const handleAddResourceRequest = useCallback((_type: AgentFlowResourceType) => {
    // Mock implementation for storybook
  }, []);

  const handleRemoveResource = useCallback((_resource: AgentFlowResource) => {
    // Mock implementation for storybook
  }, []);

  const handleAddBreakpoint = useCallback((_resourceId: string, _resource: AgentFlowResourceNodeData) => {
    // Mock implementation for storybook
  }, []);

  const handleRemoveBreakpoint = useCallback((_resourceId: string, _resource: AgentFlowResourceNodeData) => {
    // Mock implementation for storybook
  }, []);

  const handleAddGuardrail = useCallback((_resourceId: string, _resource: AgentFlowResourceNodeData) => {
    // Mock implementation for storybook
  }, []);

  const setSpanForSelectedNode = useCallback((_node: any) => {
    // Mock implementation for storybook
  }, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <AgentFlow
            allowDragging={false}
            definition={sampleDefinition}
            spans={spans}
            name="Quick Query Agent"
            description="Processes quick queries with context loading and response generation"
            mode="view"
            resources={resources}
            activeResourceIds={activeResourceIds}
            setSpanForSelectedNode={setSpanForSelectedNode}
            getNodeFromSelectedSpan={getNodeFromSelectedSpan}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            onAddGuardrail={handleAddGuardrail}
            onAddResource={handleAddResourceRequest}
            onRemoveResource={handleRemoveResource}
            onSelectResource={handleSelectResource}
            enableTimelinePlayer={enableTimelinePlayer}
          />
        </div>
      </Row>
    </ReactFlowProvider>
  );
};

// Centered TimelinePlayer wrapper
interface CenteredTimelinePlayerProps {
  spans: IRawSpan[];
  enableTimelinePlayer?: boolean;
  scale?: number;
}

const CenteredTimelinePlayer = ({ spans, enableTimelinePlayer = true, scale = 1 }: CenteredTimelinePlayerProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100vh",
        padding: "20px",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <TimelinePlayer spans={spans} enableTimelinePlayer={enableTimelinePlayer} />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <CenteredTimelinePlayer spans={sampleSpans} enableTimelinePlayer={true} />,
};

export const ShortExecution: Story = {
  render: () => <CenteredTimelinePlayer spans={shortSpans} enableTimelinePlayer={true} />,
};

export const LongExecution: Story = {
  render: () => <CenteredTimelinePlayer spans={complexSpans} enableTimelinePlayer={true} />,
};

export const WithAgentFlow: Story = {
  render: () => (
    <AgentFlowWithTimeline spans={shortSpans} enableTimelinePlayer={true} activeResourceIds={["context-load-short", "completion-short"]} />
  ),
};
