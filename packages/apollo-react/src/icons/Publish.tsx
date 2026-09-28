// Auto-generated from action/publish.svg
import React from 'react';

export interface PublishProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Publish = React.forwardRef<SVGSVGElement, PublishProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.7654 10.5H15.5L12 5.83333L8.5 10.5H10.5V12.5C10.5 14.5527 10.2665 16.2304 9.67333 17.6895C9.79353 17.6291 9.91201 17.5665 10.0287 17.5017C11.778 16.5299 13.1158 15.0473 13.5201 12.2172L13.7654 10.5ZM7.82075 20.5233C6.53103 20.897 5.19718 21.1623 3.91692 21.4169C3.77727 21.4447 3.63825 21.4723 3.5 21.5C4.87109 20.5206 5.93526 19.6948 6.72257 18.7518C7.64834 17.643 8.1913 16.3724 8.40032 14.5C8.46731 13.9 8.5 13.2381 8.5 12.5H4.5L12 2.5L19.5 12.5H15.5C14.7811 17.5321 11.4784 19.4635 7.82075 20.5233Z" fill="currentColor"/>
    </svg>
  )
);

Publish.displayName = 'Publish';

export default Publish;
