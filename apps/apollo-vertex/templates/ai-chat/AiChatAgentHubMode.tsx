"use client";

import { clientTools } from "@tanstack/ai-client";
import { useChat } from "@tanstack/ai-react";
import { Entities } from "@uipath/uipath-typescript/entities";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChat } from "@/registry/ai-chat/components/ai-chat";
import { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import {
  CHOICES_TOOL_PROMPT,
  presentChoicesClient,
  renderChoices,
} from "@/registry/ai-chat/tools/choices";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/shared";
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
import type { InsightsSchema } from "@/registry/ai-chat/tools/insights/shared";
import {
  createInsightsTableTool,
  insightsTableClient,
} from "@/registry/ai-chat/tools/insights-table";
import { DataFabricGate } from "./AiChatDataFabricGate";
import { InsightsGate } from "./AiChatInsightsGate";
import type { OrgTenantInfo } from "./AiChatLoginGate";
import { createUiPathSdk } from "./ai-chat-example-utils";

const INSIGHTS_SOURCE_TYPE = "ao";

interface AgentHubChatProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
}

interface AgentHubChatInnerProps {
  accessToken: string;
  orgTenant: OrgTenantInfo;
  entities: Record<string, Entity>;
  insightsSchema: InsightsSchema;
  insightsBaseUrl: string;
}

function AgentHubChatInner({
  accessToken,
  orgTenant,
  entities,
  insightsSchema,
  insightsBaseUrl,
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

  const insightsTableTool = createInsightsTableTool({
    sourceType: INSIGHTS_SOURCE_TYPE,
    accessToken,
    insightsBaseUrl,
    schema: insightsSchema,
  });

  const tools = clientTools(
    presentChoicesClient,
    dataFabricTableClient,
    dataFabricDistributionClient,
    dataFabricLineClient,
    dataFabricMultiLineClient,
    dataFabricKpiClient,
    insightsTableClient,
  );

  const chartToolSteering = [
    "When the user asks for data, pick the tool that matches the source:",
    `- "insights_*" tools — when the user asks about Insights / "${INSIGHTS_SOURCE_TYPE}" / vertical-solution data, names a Table.Field listed in the Insights Schema Reference, or names a table from the Insights Schema Reference (e.g. process runs, element runs, incidents).`,
    '- "data_fabric_*" tools — when the user asks about Data Fabric entities listed in the Entity Reference.',
    "Within the Data Fabric source, pick the most specific chart tool:",
    '- "data_fabric_table" — list/show records, view fields side by side.',
    '- "data_fabric_kpi" — single-number / scalar questions ("how many orders", "total revenue", "average invoice amount", "max order total"). No dimension or breakdown.',
    '- "data_fabric_line" — single-metric trend / time-series questions ("orders over time", "revenue by month", "growth across quarters").',
    '- "data_fabric_multi_line" — compare EXACTLY TWO metrics on a shared time axis ("orders count and revenue over time", "min vs max price by month"). The chart only supports two Y axes; for 3+ metrics render multiple charts.',
    '- "data_fabric_distribution" — histogram-style requests ("distribution of X", "histogram of X", numeric value-range binning).',
    'For the Insights source, only "insights_table" is currently available — use it for ANY Insights data request, including time-series ("last 30 days", "over time") and aggregate ("count by status") phrasings. A time filter on a datetime field is enough to express "last 30 days" / "since X".',
    "If two tools could both answer, prefer the more specific one: multi-line beats line when the user names 2+ metrics; line beats distribution for explicit time-series phrasing; kpi beats line/distribution when the user wants a single value with no breakdown.",
    'CRITICAL: when calling insights_table, dimension and filter "field" values MUST be qualified Table.Field IDs copied EXACTLY from the Insights Schema Reference (case-sensitive, including the table prefix and the trailing column part — e.g. "ELEMENTRUNS.ELEMENTNAME", not "ElementName" or "ELEMENTRUNS_ELEMENTNAME"). Unqualified or paraphrased names are silently dropped.',
  ].join("\n");

  const systemPrompt = [
    "You are a helpful assistant. Always respond using markdown format.",
    CHOICES_TOOL_PROMPT,
    chartToolSteering,
    tableTool.toolPrompt,
    distributionTool.toolPrompt,
    lineTool.toolPrompt,
    multiLineTool.toolPrompt,
    kpiTool.toolPrompt,
    insightsTableTool.toolPrompt,
  ].join("\n\n");

  const connection = createAgentHubConnection({
    baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
    model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
    accessToken: () => accessToken,
    systemPrompt,
    tools,
  });

  const { messages, sendMessage, isLoading, stop, clear, error } = useChat({
    connection,
    tools,
  });

  const emptyState = (
    <AiChatEmptyState
      description={t("autopilot_empty_description")}
      icon={<AutopilotGradientIcon size={48} aria-hidden="true" />}
    />
  );

  return (
    <AiChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={(text) => {
        void sendMessage(text);
      }}
      onStop={stop}
      onClearChat={clear}
      title="Autopilot"
      assistantName="Autopilot"
      emptyState={emptyState}
      suggestions={[
        t("shell_suggestion_recent_runs"),
        t("shell_suggestion_failing_processes"),
        t("shell_suggestion_summarize_queue"),
      ]}
      error={error ?? null}
    >
      {messages.map((message) => (
        <AiChatMessage
          key={message.id}
          message={message}
          assistantName="Autopilot"
        >
          {message.parts.map((part) => {
            if (part.type !== "tool-call" || !part.output) return null;

            if (part.name === "data_fabric_table") {
              return (
                <Suspense key={part.id}>
                  {tableTool.renderTable(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "data_fabric_distribution") {
              return (
                <Suspense key={part.id}>
                  {distributionTool.renderDistribution(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "data_fabric_line") {
              return (
                <Suspense key={part.id}>
                  {lineTool.renderLine(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "data_fabric_multi_line") {
              return (
                <Suspense key={part.id}>
                  {multiLineTool.renderMultiLine(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "data_fabric_kpi") {
              return (
                <Suspense key={part.id}>
                  {kpiTool.renderKpi(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "insights_table") {
              return (
                <Suspense key={part.id}>
                  {insightsTableTool.renderTable(part.output, part.id)}
                </Suspense>
              );
            }

            if (part.name === "presentChoices") {
              return (
                <div key={part.id}>
                  {renderChoices(part.output, {
                    onAction: (text) => {
                      void sendMessage(text);
                    },
                  })}
                </div>
              );
            }

            return null;
          })}
        </AiChatMessage>
      ))}
    </AiChat>
  );
}

export function AgentHubChat({ accessToken, orgTenant }: AgentHubChatProps) {
  const sdk = createUiPathSdk(accessToken, orgTenant);
  const entitiesService = new Entities(sdk);

  const insightsBaseUrl = `/api/insights/${orgTenant.orgName}/${orgTenant.tenantName}/insightsrtm_/api/v1`;

  return (
    <DataFabricGate entities={entitiesService} tenantId={orgTenant.tenantId}>
      {({ entities }) => (
        <InsightsGate
          baseUrl={insightsBaseUrl}
          accessToken={accessToken}
          tenantId={orgTenant.tenantId}
          sourceType={INSIGHTS_SOURCE_TYPE}
        >
          {({ schema }) => (
            <AgentHubChatInner
              accessToken={accessToken}
              orgTenant={orgTenant}
              entities={entities}
              insightsSchema={schema}
              insightsBaseUrl={insightsBaseUrl}
            />
          )}
        </InsightsGate>
      )}
    </DataFabricGate>
  );
}
