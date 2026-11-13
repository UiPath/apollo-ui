import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { hasLostFocus } from './gridEvents';
import { clickedSelection, valueTokenAt } from './sentenceTargets';
import type { useCellHover } from './useCellHover';
import type { RuleWindow } from './useRuleWindow';
import type { SentenceNavigation } from './useSentenceNavigation';

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
    onPointerCancel: consumerPointerCancel,
    ...restContainerProps
  } = containerProps ?? {};

  const onPointerOver = (event: React.PointerEvent<HTMLElement>) => {
    hoverTo(valueTokenAt(event.target));
    consumerPointerOver?.(event);
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pressedRef.current = true;
    consumerPointerDown?.(event);
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
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (stopTabbable && isTabOnView(event)) {
      event.preventDefault();
      navigation.refocus();
    } else if (navigation.onKeyDown(event)) {
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
      pressedRef.current = false;
      setFocusInside(false);
    }
    consumerBlur?.(event);
  };
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    pressedRef.current = false;
    const selection = clickedSelection(event.target);
    if (selection) {
      navigation.select(selection, false);
    }
    consumerClick?.(event);
  };

  return {
    ...restContainerProps,
    tabIndex: stopTabbable && focusInside ? -1 : 0,
    onPointerOver,
    onPointerDown,
    onPointerCancel,
    onPointerOut,
    onKeyDown,
    onFocus,
    onBlur,
    onClick,
  };
};
