import { act, render, screen } from '@testing-library/react';
import token from '@uipath/apollo-core';
import { describe, expect, it } from 'vitest';

import { AutopilotChatServiceProvider } from '../../providers/chat-service.provider';
import { AutopilotErrorProvider } from '../../providers/error-provider';
import { AutopilotChatService } from '../../service';
import { AutopilotChatInputError } from './chat-input-error';

let instanceCount = 0;

const renderError = (message: string) => {
  const chatService = AutopilotChatService.Instantiate({
    instanceName: `chat-input-error-test-${instanceCount++}`,
  });

  render(
    <AutopilotChatServiceProvider chatServiceInstance={chatService}>
      <AutopilotErrorProvider>
        <AutopilotChatInputError />
      </AutopilotErrorProvider>
    </AutopilotChatServiceProvider>
  );

  act(() => {
    chatService.setError(message);
  });
};

const PARAGRAPH_GAP = token.Spacing.SpacingXs;

const paddingBottomOf = (text: string) => getComputedStyle(screen.getByText(text)).paddingBottom;

describe('AutopilotChatInputError', () => {
  it('renders nothing without an error', () => {
    const chatService = AutopilotChatService.Instantiate({
      instanceName: `chat-input-error-test-${instanceCount++}`,
    });
    const { container } = render(
      <AutopilotChatServiceProvider chatServiceInstance={chatService}>
        <AutopilotErrorProvider>
          <AutopilotChatInputError />
        </AutopilotErrorProvider>
      </AutopilotChatServiceProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the error message', () => {
    renderError('Failed to send message.');
    expect(screen.getByText('Failed to send message.')).toBeInTheDocument();
  });

  // A trailing gap after the last paragraph leaves more space below the text
  // than above it, so the text is no longer centered in the alert bar.
  it('does not pad the bottom of a single paragraph', () => {
    renderError('Failed to send message.');
    expect(paddingBottomOf('Failed to send message.')).not.toBe(PARAGRAPH_GAP);
  });

  it('keeps the gap between paragraphs but not after the last one', () => {
    renderError('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
    expect(paddingBottomOf('First paragraph.')).toBe(PARAGRAPH_GAP);
    expect(paddingBottomOf('Second paragraph.')).toBe(PARAGRAPH_GAP);
    expect(paddingBottomOf('Third paragraph.')).not.toBe(PARAGRAPH_GAP);
  });
});
