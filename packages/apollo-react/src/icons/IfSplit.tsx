// Auto-generated from logic/if-split.svg
import React from 'react';

export interface IfSplitProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const IfSplit = React.forwardRef<SVGSVGElement, IfSplitProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M14 20L16.29 17.71L13.41 14.83L14.83 13.41L17.71 16.29L20 14V20L14 20ZM10 20H4L4 14L6.29 16.29L11 11.59L11 4H13V12.41L7.71 17.71L10 20Z" fill="currentColor"/>
    </svg>
  )
);

IfSplit.displayName = 'IfSplit';

export default IfSplit;
