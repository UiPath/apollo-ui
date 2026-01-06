// Auto-generated from action/subdirectory-arrow-right.svg
import React from 'react';

export interface SubdirectoryArrowRightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SubdirectoryArrowRight = React.forwardRef<SVGSVGElement, SubdirectoryArrowRightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M19.5 14.5L13.5 20.5L12.08 19.08L15.67 15.5H4.5V3.5H6.5V13.5H15.67L12.08 9.92L13.5 8.5L19.5 14.5Z" fill="currentColor"/>
    </svg>
  )
);

SubdirectoryArrowRight.displayName = 'SubdirectoryArrowRight';

export default SubdirectoryArrowRight;
