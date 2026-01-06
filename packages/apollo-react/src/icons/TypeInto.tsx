// Auto-generated from studio-icons/type-into.svg
import React from 'react';

export interface TypeIntoProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TypeInto = React.forwardRef<SVGSVGElement, TypeIntoProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2.5 4V7H7.5V19H10.5V7H15.5V4H2.5ZM21.5 9H12.5V12H15.5V19H18.5V12H21.5V9Z" fill="currentColor"/>
    </svg>
  )
);

TypeInto.displayName = 'TypeInto';

export default TypeInto;
