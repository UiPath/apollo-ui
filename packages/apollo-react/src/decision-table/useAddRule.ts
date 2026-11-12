import { useLayoutEffect, useRef } from 'react';
import type { AddRuleButtonProps } from './AddRuleButton';
import { activeElementOf, hasLostFocus } from './gridEvents';
import type { RuleWindow } from './useRuleWindow';

export interface AddRuleParams extends Pick<RuleWindow, 'container' | 'scrollStopIntoView'> {
  addRule: AddRuleButtonProps | undefined;
  ruleCount: number;
}

/** The add-rule action, which keeps focus on the footer's and reveals it once the host adds a rule. */
export const useAddRule = ({
  addRule,
  ruleCount,
  container,
  scrollStopIntoView,
}: AddRuleParams): AddRuleButtonProps | undefined => {
  const addedFromRef = useRef<{ count: number; from: Element | null } | null>(null);
  useLayoutEffect(() => {
    const addedFrom = addedFromRef.current;
    if (addedFrom === null || ruleCount <= addedFrom.count) return;
    addedFromRef.current = null;
    const view = container();
    if (!view || !(hasLostFocus(view) || activeElementOf(view) === addedFrom.from)) return;
    const footer = view.querySelector<HTMLElement>('[data-add-rule]');
    footer?.querySelector('button')?.focus({ preventScroll: true });
    if (footer) scrollStopIntoView(ruleCount - 1, footer);
  });
  return (
    addRule && {
      ...addRule,
      onAdd: () => {
        const view = container();
        addedFromRef.current = { count: ruleCount, from: view && activeElementOf(view) };
        addRule.onAdd();
      },
    }
  );
};
