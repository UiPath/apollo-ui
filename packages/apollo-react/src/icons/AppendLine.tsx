// Auto-generated from studio-icons/append-line.svg
import React from 'react';

export interface AppendLineProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AppendLine = React.forwardRef<SVGSVGElement, AppendLineProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M6.00001 2H14L20 8V13H18V9H13V4H6.00001L6.00008 12H4.00195L4.01001 4C4.01001 2.9 4.90001 2 6.00001 2Z" fill="currentColor"/>
<path d="M4 14H13V16H4V14Z" fill="currentColor"/>
<path d="M4 18H13V20H4V18Z" fill="currentColor"/>
<path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108"/>
    </svg>
  )
);

AppendLine.displayName = 'AppendLine';

export default AppendLine;
