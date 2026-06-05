export type PromptEditorTokenType = 'input' | 'output' | 'state' | 'resource' | 'text';

interface BaseToken {
  type: PromptEditorTokenType;
  value: string;
}

export interface PromptEditorTextToken extends BaseToken {
  type: 'text';
}

export interface PromptEditorInputToken extends BaseToken {
  type: 'input';
}

export interface PromptEditorOutputToken extends BaseToken {
  type: 'output';
}

export interface PromptEditorStateToken extends BaseToken {
  type: 'state';
}

export interface PromptEditorResourceToken extends BaseToken {
  type: 'resource';
}

export type PromptEditorToken =
  | PromptEditorInputToken
  | PromptEditorOutputToken
  | PromptEditorStateToken
  | PromptEditorResourceToken
  | PromptEditorTextToken;

export interface PromptEditorAutoCompleteOption {
  type: Exclude<PromptEditorTokenType, 'text'>;
  value: string;
}

export type PromptEditorMode = 'edit' | 'preview';

export interface PromptEditorToolbarActionsRef {
  formatBold: () => void;
  formatItalic: () => void;
  formatStrikethrough: () => void;
  formatNumberedList: () => void;
  formatBulletedList: () => void;
}

export type PromptEditorToolbarFormatAction =
  | 'bold'
  | 'bulletedList'
  | 'italic'
  | 'numberedList'
  | 'strikethrough';

export interface PromptEditorHighlightLocator {
  text: string;
  expandedText: string;
}

export interface PromptEditorHighlightItem {
  id: string;
  locator: PromptEditorHighlightLocator;
}

export interface PromptEditorTokenColorConfig {
  background: string;
  border: string;
  text: string;
  icon: string;
}

/**
 * Two-state palette: invalid = red, valid = blue. Backed by apollo-wind's semantic design tokens,
 * which already resolve per light/dark theme via CSS — no JS theme detection needed.
 */
export const getPromptEditorTokenColors = (): Record<
  'valid' | 'invalid',
  PromptEditorTokenColorConfig
> => ({
  valid: {
    background: 'var(--color-primary-lighter)',
    border: 'var(--color-primary)',
    text: 'var(--color-foreground)',
    icon: 'var(--color-primary)',
  },
  invalid: {
    background: 'var(--color-error-background)',
    border: 'var(--color-error)',
    text: 'var(--color-error-text)',
    icon: 'var(--color-error-icon)',
  },
});

/** Human-readable label for a token type, used in the chip's hover tooltip. */
export const getPromptEditorTokenTypeLabel = (type: PromptEditorTokenType): string => {
  switch (type) {
    case 'input':
      return 'Input variable';
    case 'output':
      return 'Output variable';
    case 'state':
      return 'State variable';
    case 'resource':
      return 'Resource';
    default:
      return 'Text';
  }
};

export type PromptEditorDiffType = 'added' | 'removed';

export const isPromptEditorTextToken = (token: PromptEditorToken): token is PromptEditorTextToken =>
  token.type === 'text';

export const isPromptEditorNonTextToken = (
  token: PromptEditorToken
): token is Exclude<PromptEditorToken, PromptEditorTextToken> => token.type !== 'text';
