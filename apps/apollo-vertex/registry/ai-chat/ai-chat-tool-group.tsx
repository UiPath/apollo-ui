"use client";

import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ToolCall } from "@/lib/ai-chat-types";

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
  const [userToggled, setUserToggled] = useState(false);

  const collapsed = !isLatest || (isLatest && userToggled);

  const count = toolCalls.length;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
        onClick={() => setUserToggled((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-label={
          collapsed ? t("expand_tool_calls") : t("collapse_tool_calls")
        }
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {collapsed
          ? `${count} ${count === 1 ? t("tool_call") : t("tool_calls")}`
          : t("tools_used")}
      </button>
      {!collapsed &&
        toolCalls.map((tc) => (
          <span
            key={tc.id}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 w-fit"
          >
            <Wrench className="h-3 w-3" />
            {toolDisplayNames[tc.name] ?? tc.name}
          </span>
        ))}
    </div>
  );
}
