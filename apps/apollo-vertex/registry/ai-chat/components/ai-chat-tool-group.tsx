"use client";

import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ToolCall } from "../utils/ai-chat-types";

interface AiChatToolGroupProps {
  toolCalls: ToolCall[];
  isLatest?: boolean;
  toolDisplayNames?: Record<string, string>;
}

export function AiChatToolGroup({
  toolCalls,
  isLatest = true,
  toolDisplayNames = {},
}: AiChatToolGroupProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(!isLatest);

  const count = toolCalls.length;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-controls={`tool-group-list-${toolCalls[0]?.id ?? "group"}`}
        aria-label={
          collapsed ? t("expand_tool_calls") : t("collapse_tool_calls")
        }
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
        {collapsed
          ? `${count} ${count === 1 ? t("tool_call") : t("tool_calls")}`
          : t("tools_used")}
      </button>
      {!collapsed && (
        <div
          id={`tool-group-list-${toolCalls[0]?.id ?? "group"}`}
          className="flex flex-col gap-1"
        >
          {toolCalls.map((tc) => (
            <span
              key={tc.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary w-fit"
            >
              <Wrench className="h-3 w-3" aria-hidden="true" />
              {toolDisplayNames[tc.name] ?? tc.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
