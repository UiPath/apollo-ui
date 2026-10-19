// @vitest-environment node
import { toolDefinition } from "@tanstack/ai";
import { ChatClient } from "@tanstack/ai-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createAgentHubConnection } from "./adapter";

function sseResponse(chunks: unknown[]): Response {
  const body = [
    ...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
    "data: [DONE]\n\n",
  ].join("");
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

function requestBody(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
  call: number,
): unknown {
  const body = fetchMock.mock.calls[call]?.[1]?.body;
  if (typeof body !== "string") throw new Error(`request ${call} has no body`);
  return JSON.parse(body);
}

const lookupWeather = toolDefinition({
  name: "lookupWeather",
  description: "Look up the weather for a city",
  inputSchema: z.object({ city: z.string() }),
}).client(({ city }) => ({ city, forecast: "sunny" }));

describe("createAgentHubConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams text and tool calls, runs client tools and sends results back", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        sseResponse([
          { choices: [{ delta: { content: "Checking " } }] },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: "call_1",
                      function: { name: "lookupWeather", arguments: '{"ci' },
                    },
                  ],
                },
              },
            ],
          },
          {
            choices: [
              {
                finish_reason: "tool_calls",
                delta: {
                  tool_calls: [
                    { index: 0, function: { arguments: 'ty":"Paris"}' } },
                  ],
                },
              },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(
        sseResponse([
          {
            choices: [
              { finish_reason: "stop", delta: { content: "It is sunny." } },
            ],
          },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ChatClient({
      connection: createAgentHubConnection({
        baseUrl: "https://agenthub.test",
        model: { vendor: "openai", name: "gpt-test" },
        accessToken: "token",
        tools: [lookupWeather],
      }),
      tools: [lookupWeather],
    });

    await client.sendMessage("Weather in Paris?");
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(client.getIsLoading()).toBe(false);
    });

    expect(requestBody(fetchMock, 0)).toMatchObject({
      tools: [{ name: "lookupWeather", parameters: { type: "object" } }],
    });
    expect(requestBody(fetchMock, 1)).toMatchObject({
      messages: [
        { role: "user", content: "Weather in Paris?" },
        {
          role: "assistant",
          content: "Checking ",
          tool_calls: [
            {
              id: "call_1",
              name: "lookupWeather",
              arguments: { city: "Paris" },
            },
          ],
        },
        {
          role: "tool",
          content: {
            result: JSON.stringify({ city: "Paris", forecast: "sunny" }),
            call_id: "call_1",
          },
        },
      ],
    });

    const assistantParts = client
      .getMessages()
      .filter((m) => m.role === "assistant")
      .flatMap((m) => m.parts);
    expect(assistantParts.find((p) => p.type === "tool-call")).toMatchObject({
      id: "call_1",
      name: "lookupWeather",
      output: { city: "Paris", forecast: "sunny" },
    });
    expect(assistantParts.at(-1)).toMatchObject({
      type: "text",
      content: "It is sunny.",
    });
    expect(client.getError()).toBeUndefined();
  });
});
