import type { ImagePart } from "@tanstack/ai";
import type { UIMessage } from "@tanstack/ai-client";

export function imagePartToUrl(part: ImagePart): string {
  return part.source.type === "data"
    ? `data:${part.source.mimeType};base64,${part.source.value}`
    : part.source.value;
}

export function isVisibleAssistant(m: UIMessage): boolean {
  if (m.role !== "assistant") return false;
  return m.parts.some(
    (p) =>
      (p.type === "tool-call" && p.output != null) ||
      (p.type === "text" && p.content),
  );
}

export function asBlockquote(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}
