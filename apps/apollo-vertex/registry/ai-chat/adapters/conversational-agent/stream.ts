import { EventType, type StreamChunk } from "@tanstack/ai";
import type { SessionStream } from "@uipath/uipath-typescript/conversational-agent";
import { MessageRole } from "@uipath/uipath-typescript/conversational-agent";

interface StreamQueue {
  push: (chunk: StreamChunk) => void;
  finish: () => void;
  iterable: AsyncIterable<StreamChunk>;
}

function createStreamQueue(): StreamQueue {
  const buffer: StreamChunk[] = [];
  const waiters: Array<(result: IteratorResult<StreamChunk>) => void> = [];
  let done = false;

  function push(chunk: StreamChunk) {
    if (done) return;
    const waiter = waiters.shift();
    if (waiter) {
      waiter({ value: chunk, done: false });
    } else {
      buffer.push(chunk);
    }
  }

  function finish() {
    if (done) return;
    done = true;
    for (const waiter of waiters) {
      // eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- iterator protocol: value is ignored when done
      waiter({ value: null as never, done: true });
    }
    waiters.length = 0;
  }

  const iterable: AsyncIterable<StreamChunk> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<StreamChunk>> {
          const buffered = buffer.shift();
          if (buffered)
            return Promise.resolve({ value: buffered, done: false });
          if (done)
            // eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- iterator protocol: value is ignored when done
            return Promise.resolve({ value: null as never, done: true });

          return new Promise((resolve) => {
            waiters.push(resolve);
          });
        },
      };
    },
  };

  return { push, finish, iterable };
}

export function bridgeExchange(
  session: SessionStream,
  userText: string,
  signal?: AbortSignal,
): AsyncIterable<StreamChunk> {
  const queue = createStreamQueue();
  const runId = crypto.randomUUID();
  const threadId = crypto.randomUUID();
  const cleanups: Array<() => void> = [];

  queue.push({
    type: EventType.RUN_STARTED,
    runId,
    threadId,
    timestamp: Date.now(),
  });

  const exchange = session.startExchange();

  function finishRun() {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  }

  exchange.onMessageStart((msg) => {
    if (!msg.isAssistant) return;

    const messageId = crypto.randomUUID();

    queue.push({
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "assistant",
      timestamp: Date.now(),
    });

    msg.onContentPartStart((part) => {
      if (!part.isMarkdown && !part.isText && !part.isHtml) return;

      part.onChunk((chunk) => {
        queue.push({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId,
          delta: chunk.data ?? "",
          timestamp: Date.now(),
        });
      });
    });

    msg.onMessageEnd(() => {
      queue.push({
        type: EventType.TEXT_MESSAGE_END,
        messageId,
        timestamp: Date.now(),
      });
    });
  });

  exchange.onExchangeEnd(() => {
    queue.push({
      type: EventType.RUN_FINISHED,
      runId,
      threadId,
      finishReason: "stop",
      timestamp: Date.now(),
    });
    finishRun();
    queue.finish();
  });

  exchange.onErrorStart((err) => {
    queue.push({
      type: EventType.RUN_ERROR,
      runId,
      message: err.message ?? "Exchange error",
      timestamp: Date.now(),
    });
    finishRun();
    queue.finish();
  });

  cleanups.push(
    session.onErrorStart((err) => {
      queue.push({
        type: EventType.RUN_ERROR,
        runId,
        message: err.message ?? "Session error",
        timestamp: Date.now(),
      });
      finishRun();
      queue.finish();
    }),
  );

  cleanups.push(
    session.onSessionEnd(() => {
      finishRun();
      queue.finish();
    }),
  );

  void exchange.sendMessageWithContentPart({
    data: userText,
    role: MessageRole.User,
  });

  if (signal) {
    const onAbort = () => {
      exchange.sendExchangeEnd();
      queue.push({
        type: EventType.RUN_FINISHED,
        runId,
        threadId,
        finishReason: "stop",
        timestamp: Date.now(),
      });
      finishRun();
      queue.finish();
    };
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
      cleanups.push(() => signal.removeEventListener("abort", onAbort));
    }
  }

  return queue.iterable;
}
