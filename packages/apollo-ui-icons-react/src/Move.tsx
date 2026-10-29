// Auto-generated from action/move.svg
import React from 'react';

export interface MoveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Move = React.forwardRef<SVGSVGElement, MoveProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M21.5 12L17.5 8V11H2.5V13H17.5V16L21.5 12Z" fill="currentColor"/>
    </svg>
  )
);

Move.displayName = 'Move';

export default Move;
