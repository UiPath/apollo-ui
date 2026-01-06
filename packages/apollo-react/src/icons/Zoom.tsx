// Auto-generated from third-party/zoom.svg
import React from 'react';

export interface ZoomProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Zoom = React.forwardRef<SVGSVGElement, ZoomProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#4A8CFF"/>
<path d="M6.22559 9.18228V13.4117C6.2278 13.8705 6.41206 14.3096 6.73786 14.6325C7.06367 14.9555 7.50436 15.1358 7.9631 15.134H14.1282C14.2116 15.1344 14.2917 15.1018 14.3509 15.0432C14.4102 14.9846 14.4439 14.9049 14.4445 14.8216V10.5921C14.4423 10.1334 14.258 9.69428 13.9322 9.37133C13.6064 9.04839 13.1657 8.868 12.707 8.86983H6.54375C6.50232 8.86938 6.46121 8.87711 6.42278 8.89258C6.38435 8.90805 6.34935 8.93096 6.31979 8.95998C6.29023 8.98901 6.26669 9.02359 6.25052 9.06174C6.23436 9.09988 6.22588 9.14085 6.22559 9.18228ZM14.8369 10.8321L17.3822 8.97271C17.6032 8.78943 17.7747 8.83554 17.7747 9.16703V14.8368C17.7747 15.214 17.5651 15.1683 17.3822 15.0308L14.8369 13.1755V10.8321Z" fill="white"/>
    </svg>
  )
);

Zoom.displayName = 'Zoom';

export default Zoom;
