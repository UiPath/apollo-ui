// Auto-generated from ui-bpmn-canvas/bpmn-data/bpmn-data-data-object.svg
import React from 'react';

export interface BpmnDataDataObjectProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnDataDataObject = React.forwardRef<SVGSVGElement, BpmnDataDataObjectProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M14 3L20 9V19C20 20.0999 19.0999 20.9999 18 21H6C4.9 21 4.00977 20.1 4.00977 19V5C4.00977 3.9 4.9 3 6 3H14ZM5.5 4.5V19.5H18.5V10H13V4.5H5.5Z" fill="currentColor"/>
    </svg>
  )
);

BpmnDataDataObject.displayName = 'BpmnDataDataObject';

export default BpmnDataDataObject;
