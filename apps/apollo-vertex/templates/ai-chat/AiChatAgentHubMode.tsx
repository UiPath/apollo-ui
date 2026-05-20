"use client";

import { clientTools } from "@tanstack/ai-client";
import { useChat } from "@tanstack/ai-react";
import { Entities } from "@uipath/uipath-typescript/entities";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import {
  CHOICES_TOOL_PROMPT,
  presentChoicesClient,
  renderChoices,
} from "@/registry/ai-chat/tools/choices";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/util/entities";
import {
  createDataFabricBarTool,
  dataFabricBarClient,
} from "@/registry/ai-chat/tools/data-fabric-bar";
import {
  createDataFabricDistributionTool,
  dataFabricDistributionClient,
} from "@/registry/ai-chat/tools/data-fabric-distribution";
import {
  createDataFabricKpiTool,
  dataFabricKpiClient,
} from "@/registry/ai-chat/tools/data-fabric-kpi";
import {
  createDataFabricLineTool,
  dataFabricLineClient,
} from "@/registry/ai-chat/tools/data-fabric-line";
import {
  createDataFabricMultiLineTool,
  dataFabricMultiLineClient,
} from "@/registry/ai-chat/tools/data-fabric-multi-line";
import {
  createDataFabricTableTool,
  dataFabricTableClient,
} from "@/registry/ai-chat/tools/data-fabric-table";
import type { MessageFeedbackType } from "@/registry/ai-chat/types";
import { DataFabricGate } from "./AiChatDataFabricGate";
import type { OrgTenantInfo } from "./AiChatLoginGate";
import { createUiPathSdk } from "./ai-chat-example-utils";

interface AgentHubChatProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}

interface AgentHubChatInnerProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
  entities: Record<string, Entity>;
}

function AgentHubChatInner({
  accessToken,
  orgTenant,
  entities,
}: AgentHubChatInnerProps) {
  const { t } = useTranslation();
  const dataFabricBaseUrl = `/api/datafabric/${orgTenant.orgName}/${orgTenant.tenantName}/datafabric_/api`;

  const tableTool = createDataFabricTableTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const distributionTool = createDataFabricDistributionTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const barTool = createDataFabricBarTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const lineTool = createDataFabricLineTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const multiLineTool = createDataFabricMultiLineTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const kpiTool = createDataFabricKpiTool({
    entities,
    accessToken,
    dataFabricBaseUrl,
  });

  const tools = clientTools(
    presentChoicesClient,
    dataFabricTableClient,
    dataFabricDistributionClient,
    dataFabricBarClient,
    dataFabricLineClient,
    dataFabricMultiLineClient,
    dataFabricKpiClient,
  );

  const chartToolSteering = [
    "When the user asks about Data Fabric data, pick the chart tool that best fits the request:",
    '- "data_fabric_table" — list/show records, view fields side by side.',
    '- "data_fabric_kpi" — single-number / scalar questions ("how many orders", "total revenue", "average invoice amount", "max order total"). No dimension or breakdown.',
    '- "data_fabric_line" — single-metric trend / time-series questions ("orders over time", "revenue by month", "growth across quarters").',
    '- "data_fabric_multi_line" — compare EXACTLY TWO metrics on a shared time axis ("orders count and revenue over time", "min vs max price by month"). The chart only supports two Y axes; for 3+ metrics render multiple charts.',
    '- "data_fabric_distribution" — histogram-style requests ("distribution of X", "histogram of X", numeric value-range binning).',
    '- "data_fabric_bar" — categorical breakdown / "by <category>" questions where the dimension is a string field ("orders by status", "revenue by category", "count by region"). Supports a single metric (one bar per category) or any number of metrics (grouped bars per category — 2, 3, 4+ all valid).',
    "Disambiguation — pick by the dimension first, not by metric count:",
    '- Compare/show N metrics by a STRING field → "data_fabric_bar". Bar has no metric-count limit; never ask the user to drop metrics. Examples: "compare count, total, and average Amount by Status", "min vs max Amount by CustomerName".',
    '- Compare exactly two metrics on a DATETIME axis → "data_fabric_multi_line". 3+ metrics on a datetime axis → render multiple line charts.',
    '- Single-metric trend on a DATETIME axis → "data_fabric_line".',
    '- Numeric/datetime value-range binning → "data_fabric_distribution".',
    '- Single scalar with no breakdown → "data_fabric_kpi".',
  ].join("\n");

  const systemPrompt = [
    "You are a helpful assistant. Always respond using markdown format.",
    CHOICES_TOOL_PROMPT,
    chartToolSteering,
    tableTool.toolPrompt,
    distributionTool.toolPrompt,
    barTool.toolPrompt,
    lineTool.toolPrompt,
    multiLineTool.toolPrompt,
    kpiTool.toolPrompt,
  ].join("\n\n");

  const connection = createAgentHubConnection({
    baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
    model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
    accessToken: () => accessToken,
    systemPrompt,
    tools,
  });

  const { messages, sendMessage, reload, status, stop, clear, error } = useChat(
    {
      connection,
      tools,
    },
  );

  const emptyState = (
    <AiChatEmptyState
      description={t("autopilot_empty_description")}
      icon={<AutopilotGradientIcon size={48} aria-hidden="true" />}
    />
  );

  const [feedback, setFeedback] = useState<Record<string, MessageFeedbackType>>(
    {},
  );

  return (
    <AiChat
      messages={messages}
      status={status}
      onSendMessage={(text, parts) => {
        if (!parts?.length) {
          void sendMessage(text);
          return;
        }
        void sendMessage({
          content: [
            ...(text ? [{ type: "text" as const, content: text }] : []),
            ...parts,
          ],
        });
      }}
      onStop={stop}
      onClearChat={clear}
      onFeedback={(messageId, type) => {
        setFeedback((prev) => ({ ...prev, [messageId]: type }));
      }}
      getFeedback={(messageId) => feedback[messageId] ?? null}
      onRegenerate={() => void reload()}
      onEditMessage={(_messageId, content) => void sendMessage(content)}
      enableTextSelection
      renderToolPart={(part) => {
        if (!part.output) return null;

        if (part.name === "data_fabric_table") {
          return (
            <Suspense>{tableTool.renderTable(part.output, part.id)}</Suspense>
          );
        }

        if (part.name === "data_fabric_distribution") {
          return (
            <Suspense>
              {distributionTool.renderDistribution(part.output, part.id)}
            </Suspense>
          );
        }

        if (part.name === "data_fabric_bar") {
          return <Suspense>{barTool.renderBar(part.output, part.id)}</Suspense>;
        }

        if (part.name === "data_fabric_line") {
          return (
            <Suspense>{lineTool.renderLine(part.output, part.id)}</Suspense>
          );
        }

        if (part.name === "data_fabric_multi_line") {
          return (
            <Suspense>
              {multiLineTool.renderMultiLine(part.output, part.id)}
            </Suspense>
          );
        }

        if (part.name === "data_fabric_kpi") {
          return <Suspense>{kpiTool.renderKpi(part.output, part.id)}</Suspense>;
        }

        if (part.name === "presentChoices") {
          return renderChoices(part.output, {
            onAction: (text) => {
              void sendMessage(text);
            },
          });
        }

        return null;
      }}
      title="AI Assistant"
      assistantName="AI Assistant"
      emptyState={emptyState}
      acceptedFileTypes="image/*"
      suggestions={[
        t("shell_suggestion_recent_runs"),
        t("shell_suggestion_failing_processes"),
        t("shell_suggestion_summarize_queue"),
      ]}
      error={error ?? null}
    />
  );
}

export function AgentHubChat({ accessToken, orgTenant }: AgentHubChatProps) {
  const sdk = createUiPathSdk(accessToken, orgTenant);
  const entitiesService = new Entities(sdk);

  return (
    <DataFabricGate entities={entitiesService} tenantId={orgTenant.tenantId}>
      {({ entities }) => (
        <AgentHubChatInner
          accessToken={accessToken}
          orgTenant={orgTenant}
          entities={entities}
        />
      )}
    </DataFabricGate>
  );
}
