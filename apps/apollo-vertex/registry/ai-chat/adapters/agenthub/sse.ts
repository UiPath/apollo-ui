/**
 * OpenAI-compatible SSE (Server-Sent Events) stream parser.
 *
 * Reads a ReadableStream and yields parsed JSON objects from `data:` lines.
 * Follows the SSE spec: https://html.spec.whatwg.org/multipage/server-sent-events.html
 *
 * - Lines starting with `:` are comments (skipped)
 * - Lines starting with `data:` carry the payload
 * - Empty lines are event separators (skipped)
 * - `[DONE]` is the OpenAI convention for end-of-stream
 */

const DATA_PREFIX = "data:";

export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      // eslint-disable-next-line no-await-in-loop -- sequential stream reads are inherently serial
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (!trimmed.startsWith(DATA_PREFIX)) continue;

        const payload = trimmed.slice(DATA_PREFIX.length).trim();
        if (payload === "[DONE]") return;

        try {
          yield JSON.parse(payload);
        } catch {
          // skip unparseable lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
