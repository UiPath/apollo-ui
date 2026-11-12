import { useLayoutEffect, useRef } from 'react';
import type { AddRuleButtonProps } from './AddRuleButton';
import { useRequestRender } from './useRequestRender';
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
  const requestRender = useRequestRender();
  const addedFromRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const addedFrom = addedFromRef.current;
    addedFromRef.current = null;
    if (addedFrom === null || ruleCount <= addedFrom) return;
    const footer = container()?.querySelector<HTMLElement>('[data-add-rule]');
    footer?.querySelector('button')?.focus({ preventScroll: true });
    if (footer) scrollStopIntoView(ruleCount - 1, footer);
  });
  return (
    addRule && {
      ...addRule,
      onAdd: () => {
        addedFromRef.current = ruleCount;
        addRule.onAdd();
        requestRender();
      },
    }
  );
};
