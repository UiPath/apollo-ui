import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model = 'claude-sonnet-4-5',
  }: {
    messages: UIMessage[];
    model?: string;
  } = await req.json();

  const result = streamText({
    model: anthropic(model),
    messages: await convertToModelMessages(messages),
    system: 'You are a helpful assistant that can answer questions and help with tasks.',
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
