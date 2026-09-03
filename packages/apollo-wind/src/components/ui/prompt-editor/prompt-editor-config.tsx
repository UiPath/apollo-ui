import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { PromptEditorDiffType, PromptEditorTokenType } from './types';

/**
 * Props handed to a consumer-supplied token-pill renderer. `defaultPill` is the built-in
 * `TokenPillWithTooltip` rendered with the same props, so a consumer can decorate it (wrap it in a
 * richer tooltip / warning affordance) instead of rebuilding the pill from scratch.
 */
export interface PromptEditorTokenPillSlotProps {
  /** Variable path without a leading `$` (apollo-wind convention). */
  value: string;
  tokenType: Exclude<PromptEditorTokenType, 'text'>;
  /** Lexical node key of the underlying decorator node (drives NodeSelection / replace commands). */
  nodeKey: string;
  diffType?: PromptEditorDiffType;
  readonly: boolean;
  isInvalid?: boolean;
  onRemove: () => void;
  /** The built-in pill rendered with these same props. */
  defaultPill: ReactNode;
}

export type PromptEditorRenderTokenPill = (props: PromptEditorTokenPillSlotProps) => ReactNode;

/**
 * Overridable user-facing strings. Apollo-wind has no i18n runtime of its own; hosts that localize
 * (e.g. via react-i18next) pass translated values here. Every key defaults to the built-in English.
 */
export interface PromptEditorStrings {
  /** Edit/Preview switcher */
  edit: string;
  preview: string;
  editorModeLabel: string;
  /** Formatting toolbar buttons */
  bold: string;
  italic: string;
  strikethrough: string;
  numberedList: string;
  bulletedList: string;
  expand: string;
  /** `$`-trigger autocomplete menu */
  searchVariablesPlaceholder: string;
  noVariablesFound: string;
  /** Label prefix for the free-form "Insert <path>" item. */
  insertFreeForm: string;
}

export const DEFAULT_PROMPT_EDITOR_STRINGS: PromptEditorStrings = {
  edit: 'Edit',
  preview: 'Preview',
  editorModeLabel: 'Editor mode',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  numberedList: 'Numbered List',
  bulletedList: 'Bulleted List',
  expand: 'Expand',
  searchVariablesPlaceholder: 'Search variables…',
  noVariablesFound: 'No variables found.',
  insertFreeForm: 'Insert',
};

interface PromptEditorConfig {
  renderTokenPill?: PromptEditorRenderTokenPill;
  strings: PromptEditorStrings;
}

const PromptEditorConfigContext = createContext<PromptEditorConfig>({
  strings: DEFAULT_PROMPT_EDITOR_STRINGS,
});

export const PromptEditorConfigProvider = PromptEditorConfigContext.Provider;

/**
 * Read the active editor config. Token decorator nodes render inside the `LexicalComposer` React
 * tree, so the provider mounted by `PromptEditor` is visible to them (and to plugins).
 */
export const usePromptEditorConfig = () => useContext(PromptEditorConfigContext);
