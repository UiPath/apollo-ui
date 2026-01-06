// Auto-generated from ui-bpmn-canvas/bpmn-toolbar/bpmn-toolbar-group.svg
import React from 'react';

export interface BpmnToolbarGroupProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnToolbarGroup = React.forwardRef<SVGSVGElement, BpmnToolbarGroupProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M19.5 5C19.5 4.72386 19.2761 4.5 19 4.5H5C4.72386 4.5 4.5 4.72386 4.5 5V19C4.5 19.2761 4.72386 19.5 5 19.5H19C19.2761 19.5 19.5 19.2761 19.5 19V5ZM5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3C19 3 14.7337 3 12 3C9.26633 3 5 3 5 3Z" fill="currentColor"/>
<path d="M2 2H6V6H2V2Z" fill="currentColor"/>
<path d="M18 2H22V6H18V2Z" fill="currentColor"/>
<path d="M2 18H6V22H2V18Z" fill="currentColor"/>
<path d="M18 18H22V22H18V18Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M13 9H17V17H9V13H7V7H13V9ZM13 13H10.5V15.5H15.5V10.5H13V13ZM8.5 11.5H11.5V8.5H8.5V11.5Z" fill="currentColor"/>
    </svg>
  )
);

BpmnToolbarGroup.displayName = 'BpmnToolbarGroup';

export default BpmnToolbarGroup;
