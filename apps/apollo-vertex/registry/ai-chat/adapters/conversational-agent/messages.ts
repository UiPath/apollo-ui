import type { TextPart, UIMessage } from "@tanstack/ai-client";

/**
 * Extracts the text content from the last user message.
 *
 * The Conversational Agent server tracks conversation history, so we only
 * need to send the latest user message — not the full history.
 */
export function extractLatestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "user") continue;

    return msg.parts
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.content)
      .join("");
  }
  return "";
}
