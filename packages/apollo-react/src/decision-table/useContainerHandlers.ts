import type React from 'react';
import { valueTokenAt } from './sentenceTargets';
import type { useCellHover } from './useCellHover';

/** The scroll container's props a host may add; the view names the region and owns its tab stop. */
export type DecisionTextContainerProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'aria-label' | 'tabIndex'
> &
  Record<`data-${string}`, string | undefined>;

export interface ContainerHandlersParams {
  containerProps: DecisionTextContainerProps | undefined;
  hoverTo: ReturnType<typeof useCellHover>;
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
