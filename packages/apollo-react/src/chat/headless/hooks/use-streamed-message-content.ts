import React from 'react';

import { AutopilotChatEvent, type AutopilotChatMessage } from '../../service';
import { contentPartsToMarkdown } from '../markdown/citation-parser';
import { extractRenderableContent } from '../markdown/incomplete-tokens';
import { useChatService } from '../providers/chat-service.provider';
import { useStreaming } from '../providers/streaming-provider';

const FAKE_STREAM_CHARS_COUNT = 10;
const FAKE_STREAM_INTERVAL = 50;
const CHUNK_QUEUE_PROCESS_INTERVAL = 50;

/**
 * The markdown source of a message as it streams: `contentParts` become citation markup, streamed
 * chunks are applied at most every 50ms with incomplete tokens held back, and a `fakeStream`
 * message is revealed a few characters at a time. Only the calling component re-renders on
 * chunks, so a transcript is not re-rendered per chunk.
 *
 * @returns the source to render, and whether a fake stream is still revealing it
 */
export function useStreamedMessageContent(message: AutopilotChatMessage) {
  // Only store message ID and content separately to minimize re-renders
  const messageId = React.useRef(message.id);

  // Generate initial content from contentParts if available, otherwise use message.content
  const getInitialContent = React.useCallback(() => {
    if (message.contentParts && message.contentParts.length > 0) {
      return contentPartsToMarkdown(messageId.current, message.contentParts);
    }
    return message.content || '';
  }, [message.contentParts, message.content]);

  const [content, setContent] = React.useState(message.fakeStream ? '' : getInitialContent());
  const [fakeStreaming, setFakeStreaming] = React.useState(!!message.fakeStream);
  const chatService = useChatService();
  const { setStreaming } = useStreaming();
  const chunkQueue = React.useRef<string[]>([]);
  const lastChunkQueueProcessedTime = React.useRef<number>(0);
  const incompleteTokenBuffer = React.useRef<string>('');

  // Update the message ID ref if a new message is passed
  React.useEffect(() => {
    let unsubscribeStopResponse: (() => void) | undefined;
    let fakeStreamInterval: ReturnType<typeof setInterval> | undefined;

    if (message.id !== messageId.current || !message.stream) {
      messageId.current = message.id;
      setContent(message.fakeStream ? '' : getInitialContent());
    }

    if (message.fakeStream) {
      unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
        clearInterval(fakeStreamInterval);
        setStreaming(false);
        setFakeStreaming(false);
        setContent(getInitialContent());
        chunkQueue.current = [];
        incompleteTokenBuffer.current = '';
        lastChunkQueueProcessedTime.current = 0;
      });

      const characters = getInitialContent().split('');
      let charIndex = 0;

      setStreaming(true);
      setFakeStreaming(true);

      fakeStreamInterval = setInterval(() => {
        if (charIndex < characters.length) {
          const chunkSize = FAKE_STREAM_CHARS_COUNT;
          const endIndex = Math.min(charIndex + chunkSize, characters.length);
          const chunk = characters.slice(charIndex, endIndex).join('');

          setContent((prevContent) => `${prevContent}${chunk}`);

          charIndex = endIndex;
        } else {
          clearInterval(fakeStreamInterval);
          setStreaming(false);
          setFakeStreaming(false);
        }
      }, FAKE_STREAM_INTERVAL);
    }

    return () => {
      unsubscribeStopResponse?.();

      if (fakeStreamInterval) {
        clearInterval(fakeStreamInterval);
        setFakeStreaming(false);
      }
    };
  }, [message, chatService, setStreaming, getInitialContent]);

  const handleSendChunk = React.useCallback((msg: AutopilotChatMessage) => {
    if (msg.id !== messageId.current) {
      return;
    }

    chunkQueue.current.push(msg.content);

    if (Date.now() - lastChunkQueueProcessedTime.current > CHUNK_QUEUE_PROCESS_INTERVAL) {
      lastChunkQueueProcessedTime.current = Date.now();

      if (msg.contentParts) {
        const fullContent = contentPartsToMarkdown(messageId.current, msg.contentParts);
        const { renderable } = extractRenderableContent(fullContent);
        setContent(renderable);
        return;
      }

      // Combine buffered incomplete token with new chunks
      const accumulated = incompleteTokenBuffer.current + chunkQueue.current.join('');
      const { renderable, buffered } = extractRenderableContent(accumulated);

      incompleteTokenBuffer.current = buffered;
      chunkQueue.current = [];

      if (renderable) {
        setContent((prevContent) => `${prevContent}${renderable}`);
      }
    } else if (msg.done) {
      lastChunkQueueProcessedTime.current = 0;

      if (msg.contentParts) {
        setContent(contentPartsToMarkdown(messageId.current, msg.contentParts));
        return;
      }

      // Stream complete - flush everything including any incomplete tokens
      const remaining = incompleteTokenBuffer.current + chunkQueue.current.join('');
      incompleteTokenBuffer.current = '';
      chunkQueue.current = [];
      setContent((prevContent) => `${prevContent}${remaining}`);
    }
  }, []);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribe = chatService.on(AutopilotChatEvent.SendChunk, handleSendChunk);

    return () => {
      unsubscribe();
    };
  }, [chatService, handleSendChunk]);

  return { content, fakeStreaming };
}
