// Auto-generated from editor/title.svg
import React from 'react';

export interface TitleProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Title = React.forwardRef<SVGSVGElement, TitleProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M5 4.5V7.5H10.5V19.5H13.5V7.5H19V4.5H5Z" fill="currentColor"/>
    </svg>
  )
);

Title.displayName = 'Title';

export default Title;
