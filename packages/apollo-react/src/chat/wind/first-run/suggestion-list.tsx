import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { PromptSuggestions, type PromptSuggestionsProps } from '@uipath/apollo-wind';

import { useSuggestionSelect } from '../../headless/hooks/use-suggestions';
import { useChatState } from '../../headless/providers/chat-state-provider';
import type { AutopilotChatSuggestion } from '../../service';

/** Service suggestions as apollo-wind chips; picking one sends it or fills the composer. */
export function SuggestionList({
  suggestions,
  sendOnClick,
  ...props
}: {
  suggestions: AutopilotChatSuggestion[];
  sendOnClick: boolean;
} & Omit<PromptSuggestionsProps, 'suggestions' | 'onSelect' | 'density' | 'strings'>) {
  const { _ } = useLingui();
  const { spacing } = useChatState();
  const select = useSuggestionSelect();

  return (
    <PromptSuggestions
      data-slot="wind-chat-suggestions"
      suggestions={suggestions}
      density={spacing.compactMode ? 'compact' : 'comfortable'}
      onSelect={({ label, prompt }) => select({ label, prompt: prompt ?? label }, sendOnClick)}
      strings={{
        label: _(msg({ id: 'autopilot-chat.message.suggestions-title', message: `Suggestions` })),
      }}
      {...props}
    />
  );
}
