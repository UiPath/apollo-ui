import { cn } from '@/lib';
import { ChatComposer } from '@/components/custom/chat-composer';
import {
  PromptSuggestions,
  type PromptSuggestion,
} from '@/components/custom/chat-prompt-suggestions';

// ============================================================================
// Types
// ============================================================================

export interface ChatFirstExperienceProps {
  className?: string;
  /** Greeting name displayed in the heading */
  userName?: string;
  /** Subtitle below the greeting */
  subtitle?: string;
  /** Placeholder text inside the composer */
  composerPlaceholder?: string;
  /** Prompt suggestions shown below the composer */
  suggestions?: PromptSuggestion[];
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (suggestion: PromptSuggestion) => void;
  /** Callback when the composer submit button is clicked */
  onSubmit?: (value: string) => void;
}

// ============================================================================
// ChatFirstExperience
// ============================================================================

/**
 * The initial "first run" experience shown in the Canvas when
 * a user opens the Delegate Chat page with no active conversation.
 *
 * Displays a greeting, a composer input, and prompt suggestions,
 * all constrained to 800px max-width and centered in the canvas.
 */
export function ChatFirstExperience({
  className,
  userName = 'David',
  subtitle = 'What should we work on today?',
  composerPlaceholder = 'I would like you to automate my',
  suggestions = [
    { id: '1', label: 'Make a list of affordable apartments in NYC' },
    { id: '2', label: 'Find the highest CD rates' },
    { id: '3', label: 'Lorem ipsum dolor sit amet' },
  ],
  onSuggestionClick,
  onSubmit,
}: ChatFirstExperienceProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center',
        className
      )}
    >
      {/* 800px content container */}
      <div className="flex w-full max-w-[800px] flex-col items-center gap-[37px]">
        {/* Greeting */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[40px] font-bold leading-9 tracking-[-0.8px] text-foreground">
            Hello {userName}
          </h1>
          <p className="mt-1 text-base font-normal leading-9 text-foreground-secondary">
            {subtitle}
          </p>
        </div>

        {/* Composer */}
        <ChatComposer
          placeholder={composerPlaceholder}
          onSubmit={onSubmit}
        />

        {/* Prompt suggestions */}
        <PromptSuggestions
          className="w-full"
          suggestions={suggestions}
          onSelect={onSuggestionClick}
        />
      </div>
    </div>
  );
}
