// Auto-generated from navigation/zoom-not-fixed.svg
import React from 'react';

export interface ZoomNotFixedProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ZoomNotFixed = React.forwardRef<SVGSVGElement, ZoomNotFixedProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M13 3.06C17.17 3.52 20.48 6.83 20.94 11H23V13H20.94C20.48 17.17 17.17 20.48 13 20.94V23H11V20.94C6.83 20.48 3.52 17.17 3.06 13H1V11H3.06C3.52 6.83 6.83 3.52 11 3.06V1H13V3.06ZM5 12C5 15.87 8.13 19 12 19C15.87 19 19 15.87 19 12C19 8.13 15.87 5 12 5C8.13 5 5 8.13 5 12Z" fill="currentColor"/>
    </svg>
  )
);

ZoomNotFixed.displayName = 'ZoomNotFixed';

export default ZoomNotFixed;
