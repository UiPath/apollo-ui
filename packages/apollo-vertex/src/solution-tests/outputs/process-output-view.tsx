"use client";

import { useSolutionTestsConfig } from "../context";
import { JsonPanel, formatJson } from "../evaluators/output-panels";
import { resolveProcessOutputRenderer } from "./registry";

interface ProcessOutputViewProps {
  agentId?: string;
  processName?: string;
  output: unknown;
  title?: string;
  /** "bare" drops the panel chrome for hosts that own it (e.g. a dialog body). */
  variant?: "panel" | "bare";
}

/** One process's output: the registered renderer when one matches, raw JSON otherwise. */
export const ProcessOutputView = ({
  agentId,
  processName,
  output,
  title,
  variant = "panel",
}: ProcessOutputViewProps) => {
  const { outputRenderers } = useSolutionTestsConfig();
  const renderer = resolveProcessOutputRenderer(
    { agentId, processName },
    outputRenderers,
  );
  const rendered = renderer?.({ output }) ?? null;

  if (rendered == null) {
    if (variant === "bare") {
      return (
        <pre className="whitespace-pre-wrap break-words text-xs">
          {formatJson(output)}
        </pre>
      );
    }
    return <JsonPanel title={title} data={output} />;
  }

  if (variant === "bare" || title == null) {
    return rendered;
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      {rendered}
    </div>
  );
};
