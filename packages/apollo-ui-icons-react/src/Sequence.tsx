// Auto-generated from object/sequence.svg
import React from 'react';

export interface SequenceProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Sequence = React.forwardRef<SVGSVGElement, SequenceProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 5C1 3.89543 1.89543 3 3 3H21C22.1046 3 23 3.89543 23 5V7C23 8.10457 22.1046 9 21 9H3C1.89543 9 1 8.10457 1 7V5ZM21 5H3V7H21V5Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M1 17C1 15.8954 1.89543 15 3 15H21C22.1046 15 23 15.8954 23 17V19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V17ZM21 17H3V19H21V17Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M15 11L12 13.5L9 11H15Z" fill="currentColor"/>
    </svg>
  )
);

Sequence.displayName = 'Sequence';

export default Sequence;
