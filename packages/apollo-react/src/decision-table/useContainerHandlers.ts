import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { hasLostFocus } from './gridEvents';
import { clickedDecision, clickedSelection, stopDecisionOf, valueTokenAt } from './sentenceTargets';
import type { useCellHover } from './useCellHover';
import type { RuleMenus } from './useRuleMenus';
import type { RuleWindow } from './useRuleWindow';
import { isIgnoredKey, type SentenceNavigation } from './useSentenceNavigation';
import type { ValueEditing } from './useValueEditing';

export type DecisionTextContainerProps = React.HTMLAttributes<HTMLElement> &
  Record<`data-${string}`, string | undefined>;

export interface ContainerHandlersParams {
  containerProps: DecisionTextContainerProps | undefined;
  hoverTo: ReturnType<typeof useCellHover>;
  navigation: SentenceNavigation;
  valueEditing: ValueEditing;
  ruleMenus: RuleMenus;
  onOpenDecision: ((decisionId: string) => void) | undefined;
  container: RuleWindow['container'];
  /** Whether a selected stop takes Tab into the view in place of the view itself. */
  stopTabbable: boolean;
}

/** The consumer's container props, with the view's own handlers run before the consumer's. */
export const useContainerHandlers = ({
  containerProps,
  hoverTo,
  navigation,
  valueEditing,
  ruleMenus,
  onOpenDecision,
  container,
  stopTabbable,
}: ContainerHandlersParams) => {
  const focusWithinRef = useRef(false);
  const pressedRef = useRef(false);
  const [focusInside, setFocusInside] = useState(false);
  useEffect(() => {
    const view = container();
    if (focusWithinRef.current && view && hasLostFocus(view)) view.focus();
  });

  const {
    onPointerOver: consumerPointerOver,
    onPointerOut: consumerPointerOut,
    onKeyDown: consumerKeyDown,
    onFocus: consumerFocus,
    onBlur: consumerBlur,
    onClick: consumerClick,
    onPointerDown: consumerPointerDown,
    onPointerUp: consumerPointerUp,
    onPointerCancel: consumerPointerCancel,
    ...restContainerProps
  } = containerProps ?? {};

  const onPointerOver = (event: React.PointerEvent<HTMLElement>) => {
    hoverTo(valueTokenAt(event.target));
    consumerPointerOver?.(event);
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pressedRef.current = true;
    valueEditing.onPointerDown(event);
    consumerPointerDown?.(event);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    valueEditing.onPointerUp();
    consumerPointerUp?.(event);
  };
  const onPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    pressedRef.current = false;
    consumerPointerCancel?.(event);
  };
  const onPointerOut = (event: React.PointerEvent<HTMLElement>) => {
    const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!event.currentTarget.contains(to)) {
      hoverTo(null);
    }
    consumerPointerOut?.(event);
  };
  const openDecision = (event: React.SyntheticEvent, decisionId: string | undefined): boolean => {
    if (!onOpenDecision || decisionId === undefined) return false;
    event.preventDefault();
    onOpenDecision(decisionId);
    return true;
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const opened =
      event.key === 'Enter' &&
      event.altKey &&
      !isIgnoredKey(event) &&
      openDecision(event, stopDecisionOf(event.target));
    if (!opened && !valueEditing.onKeyDown(event) && !navigation.onKeyDown(event)) {
      consumerKeyDown?.(event);
    }
  };
  const onFocus = (event: React.FocusEvent<HTMLElement>) => {
    const entered = !focusWithinRef.current && event.target === event.currentTarget;
    focusWithinRef.current = true;
    setFocusInside(true);
    if (entered && stopTabbable && !pressedRef.current) navigation.refocus();
    consumerFocus?.(event);
  };
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      focusWithinRef.current = false;
      pressedRef.current = false;
      setFocusInside(false);
    }
    consumerBlur?.(event);
  };
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    pressedRef.current = false;
    const claimed =
      openDecision(event, clickedDecision(event.target)) ||
      ruleMenus.onClick(event) ||
      valueEditing.onClick(event);
    const selection = claimed ? null : clickedSelection(event.target);
    if (selection) {
      navigation.select(selection, undefined, false);
    }
    consumerClick?.(event);
  };

  return {
    tabIndex: stopTabbable && focusInside ? -1 : 0,
    onPointerOver,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerOut,
    onKeyDown,
    onFocus,
    onBlur,
    onClick,
    ...restContainerProps,
  };
};
