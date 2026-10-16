import {
  ChatHero,
  ChatHeroDescription,
  ChatHeroHeader,
  type ChatHeroLayout,
  ChatHeroLogo,
  ChatHeroTitle,
  cn,
} from '@uipath/apollo-wind';
import type React from 'react';

import { AutopilotLogo } from '../../assets/autopilot-logo';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { useLoading } from '../../headless/providers/loading-provider';
import { ThinkingRow } from '../messages/thinking-row';
import { SuggestionList } from './suggestion-list';

/**
 * Whether the first-run experience shows in Wind: the shared selector, but not while a
 * conversation is loading, where the skeleton shows instead.
 */
export function useFirstRunShown() {
  const { firstRunVisible } = useChatState();
  const { skeletonLoader } = useLoading();
  return firstRunVisible && !skeletonLoader;
}

// Keeps the chip that takes keyboard focus in view inside the sideways-scrolling row.
const revealFocusedChip = (event: React.FocusEvent<HTMLElement>) =>
  (event.target as HTMLElement).scrollIntoView?.({ block: 'nearest', inline: 'nearest' });

/**
 * The first-run experience on apollo-wind's `ChatHero`: the service's first-run title,
 * description and suggestions, around whatever is passed as `children` (the composer, in the
 * centered layout, where the suggestions are a sideways row under the welcome text). While it is
 * not showing the hero stays mounted as a plain wrapper with nothing but `children`, so the
 * composer inside is never remounted when the first message arrives and keeps its draft, focus
 * and caret. A reply awaited before any message shows its thinking row here, as Material shows its
 * loading text beside the first-run experience.
 */
export function FirstRun({
  layout,
  className,
  wrapperClassName,
  children,
}: {
  layout: ChatHeroLayout;
  /** Classes while the first-run experience shows. */
  className?: string;
  /** Classes while it does not. */
  wrapperClassName?: string;
  children?: React.ReactNode;
}) {
  const { firstRunExperience, spacing } = useChatState();
  const { showLoading } = useLoading();
  const shown = useFirstRunShown();
  const density = spacing.compactMode ? 'compact' : 'comfortable';
  const suggestions = firstRunExperience?.suggestions ?? [];
  const centered = layout === 'centered';

  return (
    <ChatHero
      layout={layout}
      density={density}
      data-first-run={shown || undefined}
      className={shown ? className : cn('flex-none gap-0', wrapperClassName)}
    >
      {shown && (
        <ChatHeroHeader>
          {centered && (
            <ChatHeroLogo>
              <AutopilotLogo className="size-10" />
            </ChatHeroLogo>
          )}
          <ChatHeroTitle>{firstRunExperience?.title}</ChatHeroTitle>
          <ChatHeroDescription>{firstRunExperience?.description}</ChatHeroDescription>
        </ChatHeroHeader>
      )}
      {shown && suggestions.length > 0 && (
        <SuggestionList
          suggestions={suggestions}
          sendOnClick={firstRunExperience?.sendOnClick ?? false}
          // Centered: one row under the welcome text, scrolling sideways with faded edges, and
          // centered while it fits. Docked: Material's vertical list.
          orientation={centered ? 'horizontal' : 'vertical'}
          className={
            centered ? 'items-center [&_[data-slot=prompt-suggestions-list]]:max-w-full' : undefined
          }
          onFocus={centered ? revealFocusedChip : undefined}
        />
      )}
      {shown && showLoading && <ThinkingRow />}
      {children}
    </ChatHero>
  );
}
