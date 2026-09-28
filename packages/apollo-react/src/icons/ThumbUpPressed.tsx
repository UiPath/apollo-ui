// Auto-generated from action/thumb-up-pressed.svg
import React from 'react';

export interface ThumbUpPressedProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ThumbUpPressed = React.forwardRef<SVGSVGElement, ThumbUpPressedProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M5 22H1V10H5V22ZM15.2305 3.0498C15.5004 3.3198 15.6699 3.70042 15.6699 4.11035L15.6396 4.42969L14.6904 9H21C22.1 9 23 9.9 23 11V13C23 13.26 22.9504 13.5005 22.8604 13.7305L19.8398 20.7803C19.5398 21.5001 18.8299 22 18 22H9C7.9 22 7 21.1 7 20V10C7 9.45 7.21984 8.94984 7.58984 8.58984L14.1699 2L15.2305 3.0498Z" fill="currentColor"/>
    </svg>
  )
);

ThumbUpPressed.displayName = 'ThumbUpPressed';

export default ThumbUpPressed;
