// Auto-generated from studio-activities-icon-sets/activities-orchestrator/orchestrator-bulk-add-queue-items.svg
import React from 'react';

export interface OrchestratorBulkAddQueueItemsProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const OrchestratorBulkAddQueueItems = React.forwardRef<
  SVGSVGElement,
  OrchestratorBulkAddQueueItemsProps
>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 25}
  >
    <path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108" />
    <path d="M6 5H18V7H6V5Z" fill="currentColor" />
    <path d="M18 9H6V11H18V9Z" fill="currentColor" />
    <path d="M16 13H6V15H16V13Z" fill="currentColor" />
    <path
      d="M3 17V14H1V17C1 18.6569 2.34315 20 4 20H13V18H4C3.44772 18 3 17.5523 3 17Z"
      fill="currentColor"
    />
  </svg>
));

OrchestratorBulkAddQueueItems.displayName = 'OrchestratorBulkAddQueueItems';

export default OrchestratorBulkAddQueueItems;
