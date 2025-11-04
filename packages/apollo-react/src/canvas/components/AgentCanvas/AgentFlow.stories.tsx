import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ApButton, ApTypography, type IRawSpan } from "@uipath/portal-shell-react";
import { Panel, ReactFlowProvider } from "@uipath/uix/xyflow/react";
import { Column, FontVariantToken, Row } from "@uipath/uix/core";
import { AgentFlow } from "./AgentFlow";
import {
  ProjectType,
  type AgentFlowProps,
  type AgentFlowResource,
  type AgentFlowResourceNodeData,
  type AgentFlowResourceType,
  type AgentFlowSuggestionGroup,
  createPlaceholderSuggestion,
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

const createSampleMemorySpace = (): AgentFlowResource => {
  return {
    id: generateResourceId(),
    type: "memorySpace",
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
  onHealthScoreClick?: () => void;
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
  onHealthScoreClick,
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
      case "memorySpace": {
        newResource = createSampleMemorySpace();
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
            <li>Memory (top)</li>
            <li>Context (bottom-left)</li>
            <li>Escalations (bottom-center)</li>
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
            onHealthScoreClick={onHealthScoreClick}
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
  render: (args) => <AgentFlowWrapper {...args} />,
};

export const ViewMode: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    activeResourceIds: [],
    spans: [],
  },
  render: (args) => <AgentFlowWrapper {...args} />,
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
    definition: sampleAgentDefinition,
    spans: sampleSpans,
    activeResourceIds: [],
    enableTimelinePlayer: false,
  },
  render: (args) => <AgentFlowWrapper {...args} />,
};

export const DesignModeWithRealData: Story = {
  args: {
    mode: "design",
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: sampleSpans,
  },
  render: (args) => <AgentFlowWrapper {...args} />,
};

export const ViewModeEmptyTrace: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: [],
    activeResourceIds: [],
  },
  render: (args) => <AgentFlowWrapper {...args} />,
};

export const ViewModeWithoutTimelinePlayer: Story = {
  args: {
    mode: "view",
    resources: sampleResources,
    definition: sampleAgentDefinition,
    spans: sampleSpans,
    activeResourceIds: [],
    enableTimelinePlayer: false,
  },
  render: (args) => <AgentFlowWrapper {...args} />,
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
  render: (args) => {
    const HealthScoreWithClick = () => {
      const handleHealthScoreClick = useCallback(() => {
        alert("Health score clicked! This would open a panel with health score details.");
      }, []);

      return <AgentFlowWrapper {...args} healthScore={95} onHealthScoreClick={handleHealthScoreClick} />;
    };

    return <HealthScoreWithClick />;
  },
  parameters: {
    docs: {
      description: {
        story: "Agent with health score (95). The health score badge appears below the agent name and is clickable.",
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

/**
 * Suggestion Mode Story
 * Demonstrates the placeholder creation feature when clicking "+" buttons
 */

const SuggestionModeWrapper = ({
  mode,
  initialResources = sampleResources,
  spans = sampleSpans,
  enableTimelinePlayer = true,
  enableMemory = true,
}: AgentFlowWrapperProps) => {
  const [resources, setResources] = useState<AgentFlowResource[]>(initialResources);
  const [suggestionGroup, setSuggestionGroup] = useState<AgentFlowSuggestionGroup | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [pendingStandalonePlaceholderId, setPendingStandalonePlaceholderId] = useState<string | null>(null);

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

  const handleRequestPlaceholder = useCallback((type: AgentFlowResourceType, cleanedSuggestionGroup: AgentFlowSuggestionGroup | null) => {
    // Component automatically removes existing standalone placeholders
    // Use cleanedSuggestionGroup (not suggestionGroup) to build on the cleaned state

    // Create a placeholder resource
    const placeholder: Partial<AgentFlowResource> = {
      id: `placeholder-${type}-${Date.now()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: `Configure this ${type}...`,
    };

    // Add type-specific fields
    if (type === "tool") {
      (placeholder as any).iconUrl = "";
      (placeholder as any).projectType = ProjectType.Internal;
    } else if (type === "mcp") {
      (placeholder as any).slug = "";
      (placeholder as any).folderPath = "";
      (placeholder as any).availableTools = [];
    }

    // Use the cleaned suggestion group provided by the component (with standalone placeholders removed)
    // This ensures only one standalone placeholder exists at a time
    const updatedSuggestionGroup = createPlaceholderSuggestion(placeholder, cleanedSuggestionGroup, { isStandalone: true });
    setSuggestionGroup(updatedSuggestionGroup);

    // Find the suggestion ID for this placeholder and track it
    const newSuggestion = updatedSuggestionGroup.suggestions[updatedSuggestionGroup.suggestions.length - 1];
    if (newSuggestion) {
      setPendingStandalonePlaceholderId(newSuggestion.id);
    }

    return placeholder;
  }, []);

  const handleActOnSuggestion = useCallback(
    (suggestionId: string, action: "accept" | "reject") => {
      if (!suggestionGroup) return;

      const suggestion = suggestionGroup.suggestions.find((s) => s.id === suggestionId);
      const remainingSuggestions = suggestionGroup.suggestions.filter((s) => s.id !== suggestionId);

      // If we're acting on the pending standalone placeholder, clear the tracking
      if (suggestion?.isStandalone && suggestionId === pendingStandalonePlaceholderId) {
        setPendingStandalonePlaceholderId(null);
      }

      if (action === "reject") {
        // Clear the suggestion group if no more suggestions
        if (remainingSuggestions.length === 0) {
          setSuggestionGroup(null);
        } else {
          setSuggestionGroup({
            ...suggestionGroup,
            suggestions: remainingSuggestions,
          });
        }
        return;
      }

      if (!suggestion) return;

      // Handle different suggestion types
      switch (suggestion.type) {
        case "add": {
          if (suggestion.resource) {
            setResources((prev) => [...prev, suggestion.resource as AgentFlowResource]);
            setSelectedResourceId(suggestion.resource.id);
          }
          break;
        }
        case "update": {
          if (suggestion.resourceId && suggestion.updatedFields) {
            setResources((prev) =>
              prev.map((r) => (r.id === suggestion.resourceId ? ({ ...r, ...suggestion.updatedFields } as AgentFlowResource) : r))
            );
          }
          break;
        }
        case "delete": {
          if (suggestion.resourceIdToDelete) {
            setResources((prev) => prev.filter((r) => r.id !== suggestion.resourceIdToDelete));
          }
          break;
        }
        default:
          break;
      }

      // Clear the suggestion group if no more suggestions
      if (remainingSuggestions.length === 0) {
        setSuggestionGroup(null);
      } else {
        setSuggestionGroup({
          ...suggestionGroup,
          suggestions: remainingSuggestions,
        });
      }
    },
    [suggestionGroup, pendingStandalonePlaceholderId]
  );

  const handleActOnSuggestionGroup = useCallback(
    (suggestionGroupId: string, action: "accept" | "reject") => {
      if (!suggestionGroup) return;

      // Filter out standalone suggestions - they should not be affected by bulk operations
      const nonStandaloneSuggestions = suggestionGroup.suggestions.filter((s) => !s.isStandalone);

      if (action === "reject") {
        // Keep standalone suggestions, remove non-standalone ones
        const remainingSuggestions = suggestionGroup.suggestions.filter((s) => s.isStandalone);
        if (remainingSuggestions.length > 0) {
          setSuggestionGroup({
            ...suggestionGroup,
            suggestions: remainingSuggestions,
          });
        } else {
          setSuggestionGroup(null);
        }
        return;
      }

      // Process all non-standalone suggestions in order
      setResources((prevResources) => {
        let updatedResources = [...prevResources];

        nonStandaloneSuggestions.forEach((suggestion) => {
          switch (suggestion.type) {
            case "add": {
              if (suggestion.resource) {
                updatedResources.push(suggestion.resource as AgentFlowResource);
              }
              break;
            }
            case "update": {
              if (suggestion.resourceId && suggestion.updatedFields) {
                updatedResources = updatedResources.map((r) =>
                  r.id === suggestion.resourceId ? ({ ...r, ...suggestion.updatedFields } as AgentFlowResource) : r
                );
              }
              break;
            }
            case "delete": {
              if (suggestion.resourceIdToDelete) {
                updatedResources = updatedResources.filter((r) => r.id !== suggestion.resourceIdToDelete);
              }
              break;
            }
            default:
              break;
          }
        });

        return updatedResources;
      });

      // Keep standalone suggestions, clear non-standalone ones
      const remainingSuggestions = suggestionGroup.suggestions.filter((s) => s.isStandalone);
      if (remainingSuggestions.length > 0) {
        setSuggestionGroup({
          ...suggestionGroup,
          suggestions: remainingSuggestions,
        });
      } else {
        setSuggestionGroup(null);
      }
    },
    [suggestionGroup]
  );

  const handleSelectResource = useCallback(
    (resourceId: string | null) => {
      setSelectedResourceId(resourceId);

      // If a standalone placeholder is pending and we selected it, auto-accept it
      if (pendingStandalonePlaceholderId && resourceId && resourceId !== "pane") {
        // Check if the selected resource is the pending placeholder and it still exists
        const pendingSuggestion = suggestionGroup?.suggestions.find((s) => s.id === pendingStandalonePlaceholderId);
        if (pendingSuggestion?.isStandalone && pendingSuggestion?.resource && resourceId.includes(pendingSuggestion.resource.id)) {
          // Auto-accept the standalone placeholder
          handleActOnSuggestion(pendingStandalonePlaceholderId, "accept");
          setPendingStandalonePlaceholderId(null);
        }
      }

      // If clicking on pane (empty space), reject the pending standalone placeholder
      if (resourceId === "pane" && pendingStandalonePlaceholderId) {
        // Verify the suggestion still exists and is standalone before rejecting
        const pendingSuggestion = suggestionGroup?.suggestions.find((s) => s.id === pendingStandalonePlaceholderId);
        if (pendingSuggestion?.isStandalone) {
          handleActOnSuggestion(pendingStandalonePlaceholderId, "reject");
        }
        setPendingStandalonePlaceholderId(null);
      }
    },
    [pendingStandalonePlaceholderId, suggestionGroup, handleActOnSuggestion]
  );

  const handleAddResourceDirect = useCallback((type: AgentFlowResourceType) => {
    let newResource: AgentFlowResource;

    switch (type) {
      case "escalation":
        newResource = createSampleEscalation();
        break;
      case "context":
        newResource = createSampleContext();
        break;
      case "tool":
        newResource = createSampleTool();
        break;
      case "mcp":
        newResource = createSampleMcp();
        break;
      case "memorySpace":
        newResource = createSampleMemorySpace();
        break;
      default:
        return;
    }

    setResources((prev) => [...prev, newResource]);
    setSelectedResourceId(newResource.id);
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

  const renderSidebar = () => {
    return (
      <Column
        w={300}
        p={16}
        gap={16}
        style={{
          backgroundColor: "var(--color-background-raised)",
          color: "var(--color-foreground)",
          borderLeft: "1px solid var(--color-border-de-emp)",
          overflowY: "auto",
        }}
      >
        <h3>Placeholder Mode Demo</h3>

        <div
          style={{
            padding: 12,
            borderRadius: 4,
            fontSize: "0.875rem",
          }}
        >
          <div style={{ lineHeight: "1.5" }}>
            <p style={{ margin: "0 0 12px 0" }}>
              This story demonstrates two distinct suggestion workflows that can coexist on the canvas.
            </p>

            <div style={{ borderTop: "1px solid var(--color-border)", margin: "12px 0", paddingTop: "12px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", fontWeight: 600 }}>1️⃣ Placeholder on Direct Resource Creation</h4>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.8125rem", fontStyle: "italic" }}>
                User-initiated resource creation with confirmation workflow
              </p>

              <p style={{ margin: "8px 0 4px 0", fontSize: "0.8125rem", fontWeight: 600 }}>How it works:</p>
              <ol style={{ margin: "4px 0 8px 0", paddingLeft: "20px", fontSize: "0.75rem" }}>
                <li>
                  Click any <strong>+</strong> button on the agent node
                </li>
                <li>
                  A <strong>placeholder node</strong> appears on canvas
                </li>
                <li>
                  <strong>Click placeholder</strong> → Accepts & converts to real resource
                </li>
                <li>
                  <strong>Click empty space</strong> → Rejects & removes placeholder
                </li>
              </ol>

              <p style={{ margin: "8px 0 4px 0", fontSize: "0.8125rem", fontWeight: 600 }}>Key features:</p>
              <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "0.75rem", lineHeight: "1.6" }}>
                <li>Lightweight UX: no modal interruption</li>
                <li>Only one placeholder at a time (new ones replace old)</li>
                <li>Marked as "standalone" suggestions</li>
                <li>Won't appear in suggestion group panel</li>
                <li>Excluded from bulk operations</li>
              </ul>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", margin: "12px 0", paddingTop: "12px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", fontWeight: 600 }}>2️⃣ Autopilot Suggestions View</h4>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.8125rem", fontStyle: "italic" }}>Batch suggestions from AI/middleware</p>

              <p style={{ margin: "8px 0 4px 0", fontSize: "0.8125rem", fontWeight: 600 }}>How it works:</p>
              <ol style={{ margin: "4px 0 8px 0", paddingLeft: "20px", fontSize: "0.75rem" }}>
                <li>
                  Click <strong>Inserts/Deletes/Updates/Mixed</strong> buttons (top-left)
                </li>
                <li>Multiple suggestions appear with visual indicators</li>
                <li>
                  Use <strong style={{ color: "var(--color-primary)" }}>suggestion group panel</strong> (bottom-center)
                </li>
                <li>Accept/reject individually or use bulk operations</li>
              </ol>

              <p style={{ margin: "8px 0 4px 0", fontSize: "0.8125rem", fontWeight: 600 }}>Key features:</p>
              <ul style={{ margin: "4px 0 8px 0", paddingLeft: "20px", fontSize: "0.75rem", lineHeight: "1.6" }}>
                <li>Navigation controls with up/down arrows</li>
                <li>
                  <strong>Bulk operations:</strong> Accept all / Reject all
                </li>
                <li style={{ marginTop: "4px" }}>Visual indicators:</li>
                <ul style={{ margin: "2px 0 0 0", paddingLeft: "16px", fontSize: "0.7rem" }}>
                  <li>
                    <span>●</span> <strong>Add:</strong> New resources
                  </li>
                  <li>
                    <span>●</span> <strong>Update:</strong> Modified resources
                  </li>
                  <li>
                    <span>●</span> <strong>Delete:</strong> Resources to remove
                  </li>
                </ul>
              </ul>

              <div
                style={{
                  margin: "8px 0 0 0",
                  padding: "8px",
                  backgroundColor: "var(--color-background-secondary)",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  lineHeight: "1.5",
                }}
              >
                <strong>💡 Coexistence:</strong> Both workflows can be active simultaneously without conflicts. Interactive placeholders and
                batch suggestions operate independently.
              </div>
            </div>
          </div>
        </div>
      </Column>
    );
  };

  const handleCreateInsertSuggestions = useCallback(() => {
    const newSuggestions: AgentFlowSuggestionGroup = {
      id: `suggestion-group-${Date.now()}`,
      suggestions: [
        {
          id: `suggestion-add-1-${Date.now()}`,
          type: "add",
          resource: {
            id: `suggestion-tool-${Date.now()}`,
            type: "tool",
            name: "Email Service",
            description: "Send emails to users",
            iconUrl: "",
            hasBreakpoint: false,
            hasGuardrails: false,
            projectType: ProjectType.Internal,
          },
        },
        {
          id: `suggestion-add-2-${Date.now()}`,
          type: "add",
          resource: {
            id: `suggestion-context-${Date.now()}`,
            type: "context",
            name: "User Preferences",
            description: "User preference data",
            hasBreakpoint: false,
          },
        },
      ],
      metadata: {
        title: "Add Suggestions",
        description: "Suggested resources to add",
      },
    };
    setSuggestionGroup(newSuggestions);
  }, []);

  const handleCreateDeleteSuggestions = useCallback(() => {
    // Get some existing resource IDs to suggest for deletion
    const resourcesToDelete = resources.slice(0, 2);

    const newSuggestions: AgentFlowSuggestionGroup = {
      id: `suggestion-group-${Date.now()}`,
      suggestions: resourcesToDelete.map((resource, index) => ({
        id: `suggestion-delete-${index}-${Date.now()}`,
        type: "delete" as const,
        resourceIdToDelete: resource.id,
      })),
      metadata: {
        title: "Delete Suggestions",
        description: "Suggested resources to delete",
      },
    };
    setSuggestionGroup(newSuggestions);
  }, [resources]);

  const handleCreateUpdateSuggestions = useCallback(() => {
    // Get some existing resource IDs to suggest for update
    const resourcesToUpdate = resources.slice(0, 2);
    const timestamp = Date.now();

    const newSuggestions: AgentFlowSuggestionGroup = {
      id: `suggestion-group-${timestamp}`,
      suggestions: [
        // Agent update suggestion
        {
          id: `suggestion-update-agent-${timestamp}`,
          type: "update" as const,
          resourceId: "agent",
          updatedFields: {
            name: "Test Agent (Updated)",
            description: "Test Description - Updated via suggestions",
          },
        },
        // Resource update suggestions
        ...resourcesToUpdate.map((resource, index) => ({
          id: `suggestion-update-${index}-${timestamp}`,
          type: "update" as const,
          resourceId: resource.id,
          updatedFields: {
            name: `${resource.name} (Updated)`,
            description: `${resource.description} - Updated description`,
          },
        })),
      ],
      metadata: {
        title: "Update Suggestions",
        description: "Suggested resource updates",
      },
    };
    setSuggestionGroup(newSuggestions);
  }, [resources]);

  const handleCreateMixedSuggestions = useCallback(() => {
    const existingResources = resources.slice(0, 2);
    const timestamp = Date.now();

    const newSuggestions: AgentFlowSuggestionGroup = {
      id: `suggestion-group-${timestamp}`,
      suggestions: [
        // Add suggestions
        {
          id: `suggestion-add-1-${timestamp}`,
          type: "add",
          resource: {
            id: `suggestion-tool-${timestamp}`,
            type: "tool",
            name: "Database Query",
            description: "Query database",
            iconUrl: "",
            hasBreakpoint: false,
            hasGuardrails: false,
            projectType: ProjectType.Internal,
          },
        },
        // Agent update suggestion
        {
          id: `suggestion-update-agent-${timestamp}`,
          type: "update" as const,
          resourceId: "agent",
          updatedFields: {
            name: "Test Agent (Updated)",
            description: "Updated via mixed suggestions",
          },
        },
        // Update suggestion for resource
        ...(existingResources.length > 0
          ? [
              {
                id: `suggestion-update-1-${timestamp}`,
                type: "update" as const,
                resourceId: existingResources[0]!.id,
                updatedFields: {
                  name: `${existingResources[0]!.name} (Updated)`,
                  description: "Updated via mixed suggestions",
                },
              },
            ]
          : []),
        // Delete suggestion
        ...(existingResources.length > 1
          ? [
              {
                id: `suggestion-delete-1-${timestamp}`,
                type: "delete" as const,
                resourceIdToDelete: existingResources[1]!.id,
              },
            ]
          : []),
      ],
      metadata: {
        title: "Mixed Suggestions",
        description: "Combination of add, update, and delete suggestions",
      },
    };
    setSuggestionGroup(newSuggestions);
  }, [resources]);

  const renderControlPanel = () => {
    return (
      <Panel position="top-left">
        <Column
          gap={12}
          p={20}
          style={{
            color: "var(--color-foreground)",
            backgroundColor: "var(--color-background-secondary)",
            minWidth: 280,
          }}
        >
          <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Suggestion Controls</ApTypography>

          <Column gap={8}>
            <ApTypography variant={FontVariantToken.fontSizeM}>Suggestion type:</ApTypography>
            <Row gap={8}>
              <ApButton size="small" variant="primary" label="Inserts" onClick={handleCreateInsertSuggestions} />
              <ApButton size="small" variant="primary" label="Deletes" onClick={handleCreateDeleteSuggestions} />
              <ApButton size="small" variant="primary" label="Updates" onClick={handleCreateUpdateSuggestions} />
              <ApButton size="small" variant="primary" label="Mixed" onClick={handleCreateMixedSuggestions} />
            </Row>
          </Column>
        </Column>
      </Panel>
    );
  };

  return (
    <ReactFlowProvider>
      <Row w="100%" h="100%" style={{ position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <AgentFlow
            allowDragging={false}
            definition={sampleAgentDefinition}
            spans={mode === "view" ? spans : []}
            name="Test Agent"
            description="Test Description"
            mode={mode}
            resources={resources}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onAddBreakpoint={handleAddBreakpoint}
            onRemoveBreakpoint={handleRemoveBreakpoint}
            onAddGuardrail={handleAddGuardrail}
            onAddResource={handleAddResourceDirect}
            onRemoveResource={handleRemoveResource}
            onSelectResource={handleSelectResource}
            enableTimelinePlayer={enableTimelinePlayer}
            enableMemory={enableMemory}
            onRequestResourcePlaceholder={handleRequestPlaceholder}
            suggestionGroup={suggestionGroup}
            onActOnSuggestion={handleActOnSuggestion}
            onActOnSuggestionGroup={handleActOnSuggestionGroup}
          />
        </div>
        {renderControlPanel()}
        {renderSidebar()}
      </Row>
    </ReactFlowProvider>
  );
};

export const DesignModeWithPlaceholderAndAutopilotSuggestions: Story = {
  args: {
    mode: "design",
    enableTimelinePlayer: false,
  },
  render: (args) => <SuggestionModeWrapper {...args} initialResources={sampleResources.concat(createSampleMemorySpace())} />,
};
