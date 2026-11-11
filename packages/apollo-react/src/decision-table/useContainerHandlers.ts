import type React from 'react';
import { type HoveredToken, valueTokenAt } from './sentenceTargets';

export type ContainerProps = React.HTMLAttributes<HTMLElement> &
  Record<`data-${string}`, string | undefined>;

export interface ContainerHandlersParams {
  containerProps: ContainerProps | undefined;
  hoverTo: (next: HoveredToken | null) => void;
}

/** The consumer's container props, with the view's own handlers run before the consumer's. */
export const useContainerHandlers = ({ containerProps, hoverTo }: ContainerHandlersParams) => {
  const {
    onPointerOver: consumerPointerOver,
    onPointerOut: consumerPointerOut,
    ...restContainerProps
  } = containerProps ?? {};

  const onPointerOver = (event: React.PointerEvent<HTMLElement>) => {
    hoverTo(valueTokenAt(event.target));
    consumerPointerOver?.(event);
  };
  const onPointerOut = (event: React.PointerEvent<HTMLElement>) => {
    const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!event.currentTarget.contains(to)) {
      hoverTo(null);
    }
    consumerPointerOut?.(event);
  };

  return { onPointerOver, onPointerOut, ...restContainerProps };
};
