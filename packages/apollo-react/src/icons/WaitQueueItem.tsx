// Auto-generated from studio-icons/wait-queue-item.svg
import React from 'react';

export interface WaitQueueItemProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const WaitQueueItem = React.forwardRef<SVGSVGElement, WaitQueueItemProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M6 5H18V7H6V5Z" fill="currentColor"/>
<path d="M18 9H6V11H18V9Z" fill="currentColor"/>
<path d="M13 13H6V15H13V13Z" fill="currentColor"/>
<path d="M3 17V14H1V17C1 18.6569 2.34315 20 4 20H13V18H4C3.44772 18 3 17.5523 3 17Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M21.7829 16.0118L20.1456 18.4874L21.8928 21.2824C22.0813 21.5839 21.8903 22 21.5634 22H15.4366C15.1096 22 14.9186 21.5839 15.1071 21.2824L16.8543 18.4874L15.2171 16.0118C14.6467 15.1493 15.2667 14 16.3024 14H20.6976C21.7333 14 22.3533 15.1493 21.7829 16.0118ZM18.5 17.8351L17.1077 15.7297H19.8923L18.5 17.8351Z" fill="#1976D2"/>
    </svg>
  )
);

WaitQueueItem.displayName = 'WaitQueueItem';

export default WaitQueueItem;
