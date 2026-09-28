"use client";

import type { RawAgentGetResponse } from "@uipath/uipath-typescript/conversational-agent";
import { Bot, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";

export interface AgentPickerProps {
  agents: RawAgentGetResponse[];
  isLoading: boolean;
  error: Error | null;
  selectedAgentId: string | null;
  onSelect: (agentId: string) => void;
}

export function AgentPicker({
  agents,
  isLoading,
  error,
  selectedAgentId,
  onSelect,
}: AgentPickerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading agents...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not load agents: {error.message}
      </p>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <Bot className="size-4 shrink-0" />
        No conversational agents found. Create one in UiPath Automation Cloud
        first.
      </div>
    );
  }

  return (
    <Select value={selectedAgentId ?? ""} onValueChange={onSelect}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem
            key={`${agent.id}:${agent.folderId}`}
            value={`${agent.id}:${agent.folderId}`}
          >
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
