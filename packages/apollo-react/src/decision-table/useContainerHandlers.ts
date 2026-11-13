import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { hasLostFocus, onNextGesture } from './gridEvents';
import { clickedDecision, clickedSelection, stopDecisionOf, valueTokenAt } from './sentenceTargets';
import type { useCellHover } from './useCellHover';
import type { RuleMenus } from './useRuleMenus';
import type { RuleWindow } from './useRuleWindow';
import { isIgnoredKey, type SentenceNavigation } from './useSentenceNavigation';
import type { ValueEditing, ValueEditingParams } from './useValueEditing';

/** The scroll container's props a host may add; the view names the region and owns its tab stop. */
export type DecisionTextContainerProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'aria-label' | 'tabIndex'
> &
  Record<`data-${string}`, string | undefined>;

export interface ContainerHandlersParams {
  containerProps: DecisionTextContainerProps | undefined;
  hoverTo: ReturnType<typeof useCellHover>;
  navigation: SentenceNavigation;
  valueEditing: ValueEditing;
  ruleMenus: RuleMenus;
  onOpenDecision: ValueEditingParams['onOpenDecision'];
  container: RuleWindow['container'];
  /** Whether a selected stop takes Tab into the view in place of the view itself. */
  stopTabbable: boolean;
}

/** Whether a key is a forward Tab pressed on the view itself. */
const isTabOnView = (event: React.KeyboardEvent<HTMLElement>): boolean =>
  event.key === 'Tab' && !event.shiftKey && event.target === event.currentTarget;

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
  const stopPressRef = useRef<(() => void) | null>(null);
  const [focusInside, setFocusInside] = useState(false);
  useEffect(() => {
    const view = container();
    if (focusWithinRef.current && view && hasLostFocus(view)) view.focus();
  });
  useEffect(() => () => stopPressRef.current?.(), []);

  const endPress = () => {
    stopPressRef.current?.();
    stopPressRef.current = null;
    pressedRef.current = false;
  };

  const {
    onPointerOver: consumerPointerOver,
    onPointerOut: consumerPointerOut,
    onKeyDown: consumerKeyDown,
    onFocus: consumerFocus,
    onBlur: consumerBlur,
    onClick: consumerClick,
    onPointerDown: consumerPointerDown,
    onPointerUp: consumerPointerUp,
    onMouseUp: consumerMouseUp,
    onPointerCancel: consumerPointerCancel,
    onContextMenu: consumerContextMenu,
    ...restContainerProps
  } = containerProps ?? {};

  const onPointerOver = (event: React.PointerEvent<HTMLElement>) => {
    hoverTo(valueTokenAt(event.target));
    consumerPointerOver?.(event);
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pressedRef.current = true;
    stopPressRef.current = onNextGesture(event.currentTarget, endPress);
    valueEditing.onPointerDown(event);
    consumerPointerDown?.(event);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    valueEditing.onRelease();
    consumerPointerUp?.(event);
  };
  const onMouseUp = (event: React.MouseEvent<HTMLElement>) => {
    valueEditing.onRelease();
    consumerMouseUp?.(event);
  };
  const onPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    endPress();
    consumerPointerCancel?.(event);
  };
  const onContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    valueEditing.forgetPress();
    consumerContextMenu?.(event);
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
  const openStopDecision = (event: React.KeyboardEvent<HTMLElement>): boolean =>
    event.key === 'Enter' &&
    event.altKey &&
    !isIgnoredKey(event) &&
    openDecision(event, stopDecisionOf(event.target));
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!event.repeat) valueEditing.forgetPress();
    if (stopTabbable && isTabOnView(event)) {
      event.preventDefault();
      navigation.refocus();
    } else if (
      openStopDecision(event) ||
      valueEditing.onKeyDown(event) ||
      navigation.onKeyDown(event)
    ) {
      return;
    }
    consumerKeyDown?.(event);
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
      endPress();
      if (event.relatedTarget instanceof Node) valueEditing.forgetPress();
      setFocusInside(false);
    }
    consumerBlur?.(event);
  };
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    const claimed =
      valueEditing.takeRecoveredClick(event) ||
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
    ...restContainerProps,
    tabIndex: stopTabbable && focusInside ? -1 : 0,
    onPointerOver,
    onPointerDown,
    onPointerUp,
    onMouseUp,
    onPointerCancel,
    onContextMenu,
    onPointerOut,
    onKeyDown,
    onFocus,
    onBlur,
    onClick,
  };
};
