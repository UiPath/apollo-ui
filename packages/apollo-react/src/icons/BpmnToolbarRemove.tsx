// Auto-generated from ui-bpmn-canvas/bpmn-toolbar/bpmn-toolbar-remove.svg
import React from 'react';

export interface BpmnToolbarRemoveProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnToolbarRemove = React.forwardRef<SVGSVGElement, BpmnToolbarRemoveProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        d="M18 19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V7H18V19ZM7.5 8.5V19.5H16.5V8.5H7.5ZM15.5 4H19V5.5H5V4H8.5L9.5 3H14.5L15.5 4Z"
        fill="currentColor"
      />
    </svg>
  )
);

BpmnToolbarRemove.displayName = 'BpmnToolbarRemove';

export default BpmnToolbarRemove;
