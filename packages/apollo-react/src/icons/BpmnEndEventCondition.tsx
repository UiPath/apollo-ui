// Auto-generated from ui-bpmn-canvas/bpmn-end-event/bpmn-end-event-condition.svg
import React from 'react';

export interface BpmnEndEventConditionProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnEndEventCondition = React.forwardRef<SVGSVGElement, BpmnEndEventConditionProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5V22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22V19.5C16.1421 19.5 19.5 16.1421 19.5 12Z" fill="currentColor"/>
<path d="M8 10.5H9V9.5L8 9.5V10.5Z" fill="currentColor"/>
<path d="M10 9.5V10.5H16V9.5H10Z" fill="currentColor"/>
<path d="M8 12.5H9V11.5H8V12.5Z" fill="currentColor"/>
<path d="M10 11.5V12.5H16V11.5H10Z" fill="currentColor"/>
<path d="M8 14.5H9V13.5H8V14.5Z" fill="currentColor"/>
<path d="M10 13.5V14.5H16V13.5H10Z" fill="currentColor"/>
    </svg>
  )
);

BpmnEndEventCondition.displayName = 'BpmnEndEventCondition';

export default BpmnEndEventCondition;
