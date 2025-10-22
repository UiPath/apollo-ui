import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { IRawSpan } from "@uipath/portal-shell-react";
import { ReactFlowProvider } from "@uipath/uix/xyflow/react";
import { Column, Row } from "@uipath/uix/core";
import { AgentFlow } from "./AgentFlow";
import {
  ProjectType,
  type AgentFlowProps,
  type AgentFlowResource,
  type AgentFlowResourceNodeData,
  type AgentFlowResourceType,
} from "../../types";

const meta: Meta<typeof AgentFlow> = {
  title: "Canvas/AgentFlow",
  component: AgentFlow,
  decorators: [
    (Story) => (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AgentFlow>;

// Sample data generators
const generateResourceId = () => `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const sampleContexts = [
  { name: "User Profile", description: "Information about the current user" },
  { name: "Session Context", description: "Current session information" },
  { name: "Organization Settings", description: "Organization configuration" },
  { name: "Environment Variables", description: "System environment settings" },
];

const sampleTools = [
  { name: "Send Email", description: "Email Service", projectType: ProjectType.Internal },
  { name: "Query Database", description: "Database", projectType: ProjectType.Internal },
  { name: "Call API", description: "REST API", projectType: ProjectType.Api },
  { name: "Process Document", description: "Document AI", projectType: ProjectType.Internal },
  { name: "Run Automation", description: "Automation", projectType: ProjectType.Internal },
];

const sampleEscalations = [
  { name: "Manager Approval", description: "Escalate to manager" },
  { name: "Amount Exceeded", description: "Transaction limit exceeded" },
  { name: "Security Alert", description: "Suspicious activity detected" },
  { name: "Manual Review", description: "Requires human review" },
];

const sampleMcp = [
  { name: "File parser", description: "Parse files in the workspace" },
  { name: "Budget Assistant RPC", description: "Using RPC to connect to a budget assistant server API" },
];

let contextIndex = 0;
let toolIndex = 0;
let escalationIndex = 0;
let mcpIndex = 0;

const createSampleContext = (): AgentFlowResource => {
  const sample = sampleContexts[contextIndex % sampleContexts.length] as NonNullable<(typeof sampleContexts)[number]>;
  contextIndex++;
  return {
    id: generateResourceId(),
    type: "context",
    name: sample.name,
    hasBreakpoint: false,
    hasGuardrails: false,
    description: sample.description,
  };
};

const createSampleTool = (): AgentFlowResource => {
  const sample = sampleTools[toolIndex % sampleTools.length] as NonNullable<(typeof sampleTools)[number]>;
  toolIndex++;
  return {
    id: generateResourceId(),
    type: "tool",
    name: sample.name,
    description: sample.description,
    iconUrl: "",
    hasBreakpoint: false,
    hasGuardrails: false,
    projectType: sample.projectType as ProjectType,
  };
};

const createSampleEscalation = (): AgentFlowResource => {
  const sample = sampleEscalations[escalationIndex % sampleEscalations.length] as NonNullable<(typeof sampleEscalations)[number]>;
  escalationIndex++;
  return {
    id: generateResourceId(),
    type: "escalation",
    name: sample.name,
    hasBreakpoint: false,
    hasGuardrails: false,
    description: sample.description,
  };
};

const createSampleMcp = (): AgentFlowResource => {
  const sample = sampleMcp[mcpIndex % sampleMcp.length] as NonNullable<(typeof sampleMcp)[number]>;
  mcpIndex++;
  return {
    id: generateResourceId(),
    type: "mcp",
    name: sample.name,
    slug: "",
    folderPath: "",
    availableTools: [],
    description: sample.description,
    hasBreakpoint: false,
    hasGuardrails: false,
  };
};

const createSampleMemory = (): AgentFlowResource => {
  return {
    id: generateResourceId(),
    type: "memory",
    name: "Agent Memory Space",
    description: "Memory space for the agent",
  };
};

const sampleResources: AgentFlowResource[] = [
  {
    id: "tool-slack",
    type: "tool",
    name: "Send message",
    description: "Slack",
    iconUrl: "",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
    isDisabled: false,
  },
  {
    id: "tool-ixp",
    type: "tool",
    name: "Extract data",
    description: "IXP",
    iconUrl: "",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.IXP,
    isDisabled: false,
  },
  {
    id: "tool-claim",
    type: "tool",
    name: "Validate claim",
    description: "Automation",
    iconUrl: "",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
    isDisabled: false,
  },
  {
    id: "context-user-profile",
    type: "context",
    name: "User Profile",
    description: "Information about the current user",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
  },
  {
    id: "escalation-amount-exceeded",
    type: "escalation",
    name: "Amount exceeded",
    description: "Claim form",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
  },
  {
    id: "mcp-file-parser",
    type: "mcp",
    name: "File Parser",
    description: "File Parser",
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
    slug: "file-parser",
    folderPath: "file-parser",
    availableTools: [],
  },
];

// Real agent definition from frontend examples
const sampleAgentDefinition = {
  name: "Test Agent",
  version: "1.0",
  settings: {
    model: "gpt-4",
    engine: "test-engine",
  },
  tools: [],
  resources: [],
};

// Real trace data from frontend examples
const sampleSpans: IRawSpan[] = [
  {
    Id: "span1",
    TraceId: "trace1",
    ParentId: "parent1",
    Name: "agentRun",
    StartTime: "2021-01-01T00:00:00Z",
    EndTime: "2021-01-01T00:00:30Z",
    Status: 1,
    CreatedAt: "2021-01-01T00:00:00Z",
    UpdatedAt: "2021-01-01T00:00:00Z",
    SpanType: "agentRun",
    Attributes: JSON.stringify({ type: "agentRun" }),
    OrganizationId: "org1",
    TenantId: "tenant1",
    Source: 1,
  },
  {
    Id: "span2",
    TraceId: "trace1",
    ParentId: "span1",
    Name: "contextLoad",
    StartTime: "2021-01-01T00:00:31Z",
    EndTime: "2021-01-01T00:01:00Z",
    Status: 1,
    CreatedAt: "2021-01-01T00:00:00Z",
    UpdatedAt: "2021-01-01T00:00:00Z",
    SpanType: "contextLoad",
    Attributes: JSON.stringify({ type: "contextLoad", contextName: "test_context" }),
    OrganizationId: "org1",
    TenantId: "tenant1",
    Source: 1,
  },
  {
    Id: "span3",
    TraceId: "trace1",
    ParentId: "span2",
    Name: "completion",
    StartTime: "2021-01-01T00:01:01Z",
    EndTime: "2021-01-01T00:03:00Z",
    Status: 1,
    CreatedAt: "2021-01-01T00:00:00Z",
    UpdatedAt: "2021-01-01T00:00:00Z",
    SpanType: "completion",
    Attributes: JSON.stringify({ type: "completion" }),
    OrganizationId: "org1",
    TenantId: "tenant1",
    Source: 1,
  },
];

interface AgentFlowWrapperProps {
  mode: AgentFlowProps["mode"];
  initialResources?: AgentFlowResource[];
  activeResourceIds?: string[];
  spans?: any[];
  definition?: any;
  enableTimelinePlayer?: boolean;
  enableMemory?: boolean;
  healthScore?: number;
}

const AgentFlowWrapper = ({
  mode,
  initialResources = sampleResources,
  activeResourceIds,
  spans = sampleSpans,
  definition = sampleAgentDefinition,
  enableTimelinePlayer = true,
  enableMemory = true,
  healthScore,
}: AgentFlowWrapperProps) => {
  const [resources, setResources] = useState<AgentFlowResource[]>(initialResources);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [_sidebarMode, setSidebarMode] = useState<
    "add-context" | "add-escalation" | "add-model" | "add-tool" | "add-memory" | "properties"
  >("properties");

  const handleSelectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
    setSidebarMode("properties");
  }, []);

  const handleAddResourceRequest = useCallback((type: AgentFlowResourceType) => {
    let newResource: AgentFlowResource;

    switch (type) {
      case "context": {
        newResource = createSampleContext();
        break;
      }
      case "tool": {
        newResource = createSampleTool();
        break;
      }
      case "escalation": {
        newResource = createSampleEscalation();
        break;
      }
      case "mcp": {
        newResource = createSampleMcp();
        break;
      }
      case "memory": {
        newResource = createSampleMemory();
        break;
      }
      default: {
        return;
      }
    }

    setResources((prev) => [...prev, newResource]);
    setSelectedResourceId(newResource.id);
    setSidebarMode("properties");
  }, []);

  const handleRemoveResource = useCallback(
    (resource: AgentFlowResource) => {
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      if (selectedResourceId === resource.id) {
        setSelectedResourceId(null);
      }
    },
    [selectedResourceId]
  );

  const handleEnable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: false }),
      }))
    );
  }, []);

  const handleDisable = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && { isDisabled: true }),
      }))
    );
  }, []);

  const handleAddBreakpoint = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
          hasBreakpoint: true,
        }),
      }))
    );
  }, []);

  const handleRemoveBreakpoint = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
          hasBreakpoint: false,
        }),
      }))
    );
  }, []);

  const handleAddGuardrail = useCallback((resourceId: string, resource: AgentFlowResourceNodeData) => {
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        ...(`${resource.parentNodeId}=>${r.name}:${r.id}` === resourceId && {
          hasGuardrails: true,
        }),
      }))
    );
  }, []);

  // Real span/node mapping functions from frontend
  const setSpanForSelectedNode = useCallback((_node: any) => {}, []);

  const getNodeFromSelectedSpan = useCallback((_nodes: any[]) => {
    return null;
  }, []);

  const renderSidebar = () => {
    if (mode !== "design") {
      return null;
    }

    return (
      <Column
        w={300}
        p={16}
        gap={16}
        style={{
          backgroundColor: "#f5f5f5",
          borderLeft: "1px solid #e0e0e0",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: 0 }}>Design Mode</h3>
        {selectedResourceId && (
          <div>
            <strong>Selected:</strong> {selectedResourceId}
          </div>
        )}
        <div>
          <strong>Resources:</strong> {resources.length}
        </div>
        <div style={{ fontSize: "0.875rem", color: "#666" }}>
          <p>Click the + buttons on the agent node to add:</p>
          <ul>
            <li>Escalations (top-right)</li>
            <li>Memory (top-left)</li>
            <li>Model (bottom-left)</li>
            <li>Contexts (bottom-center)</li>
            <li>Tools & MCPs (bottom-right)</li>
          </ul>
        </div>
      </Column>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <AgentFlow
            allowDragging={false}
            definition={definition}
            spans={mode === "view" ? spans : []}
            name="Test Agent"
            description="Test Description"
            mode={mode}
            resources={resources}
            activeResourceIds={activeResourceIds}
            setSpanForSelectedNode={setSpanForSelectedNode}
            getNodeFromSelectedSpan={getNodeFromSelectedSpan}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            onAddGuardrail={handleAddGuardrail}
            onAddResource={handleAddResourceRequest}
            onRemoveResource={handleRemoveResource}
            onSelectResource={handleSelectResource}
            enableTimelinePlayer={mode === "view" && enableTimelinePlayer}
            enableMemory={enableMemory}
            healthScore={healthScore}
          />
        </div>
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignMode: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
  },
  render: () => <AgentFlowWrapper mode="design" />,
};

export const ViewMode: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} spans={[]} />,
};

export const DesignModeEmpty: Story = {
  args: {
    mode: "design",
  },
  render: (args) => <AgentFlowWrapper {...args} initialResources={[]} />,
};

// New stories based on real frontend usage patterns
export const ViewModeWithTraceData: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} spans={sampleSpans} definition={sampleAgentDefinition} enableTimelinePlayer={false} />,
};

export const DesignModeWithRealData: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
  },
  render: (args) => <AgentFlowWrapper {...args} spans={sampleSpans} definition={sampleAgentDefinition} />,
};

export const ViewModeEmptyTrace: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} spans={[]} definition={sampleAgentDefinition} />,
};

export const ViewModeWithoutTimelinePlayer: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} spans={sampleSpans} definition={sampleAgentDefinition} enableTimelinePlayer={false} />,
};

export const ViewModeWithTimelinePlayer: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} spans={sampleSpans} definition={sampleAgentDefinition} />,
};

/**
 * Health Score Stories
 * Demonstrates the health score badge feature on agent nodes
 */

export const HealthScore: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
  },
  render: (args) => <AgentFlowWrapper {...args} healthScore={95} />,
  parameters: {
    docs: {
      description: {
        story: "Agent with health score (95). The health score badge appears below the agent name.",
      },
    },
  },
};

export const HealthScoreZero: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
  },
  render: (args) => <AgentFlowWrapper {...args} healthScore={0} />,
  parameters: {
    docs: {
      description: {
        story: "Agent with zero health score (0).",
      },
    },
  },
};

export const NoHealthScore: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
  },
  render: (args) => <AgentFlowWrapper {...args} healthScore={undefined} />,
  parameters: {
    docs: {
      description: {
        story: "Agent without health score. The health score badge is not rendered when undefined.",
      },
    },
  },
};
