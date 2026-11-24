import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { useState } from 'react';
import { isComposing } from './gridEvents';
import { EMPTY_HINT_PLACEHOLDER_CLASS } from './gridStyles';
import { RULE_NAME_CLASS } from './sentenceStyles';

/** A rule name field's strings. */
export interface RuleNameLabels {
  /** The field's name, e.g. "Rule name". */
  ruleNameLabel: string;
  /** An unnamed rule's placeholder, e.g. "Name this rule…". */
  ruleNamePlaceholder: string;
}

/** Renames a rule to the trimmed text of its name field. */
export type RenameRule = (rowId: string, name: string) => void;

export interface RuleNameProps {
  rowId: string;
  name: string;
  /** Whether the card's row is selected, so the field is in the tab order. */
  selected: boolean;
  labels: RuleNameLabels;
  onRename: RenameRule;
}

/** A rule's name typed in place: Enter and blur rename it, Escape restores it. */
export const RuleName: React.FC<RuleNameProps> = ({ rowId, name, selected, labels, onRename }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    const next = draft.trim();
    if (next !== name.trim()) onRename(rowId, next);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing(event)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(null);
    }
  };
  return (
    <input
      type="text"
      value={draft ?? name}
      tabIndex={selected ? 0 : -1}
      aria-label={labels.ruleNameLabel}
      placeholder={labels.ruleNamePlaceholder}
      className={cn(RULE_NAME_CLASS, EMPTY_HINT_PLACEHOLDER_CLASS)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
    />
  );
};
