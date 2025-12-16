// Auto-generated from ui-bpmn-canvas/bpmn-end-event/bpmn-end-event-timer.svg
import React from 'react';

export interface BpmnEndEventTimerProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnEndEventTimer = React.forwardRef<SVGSVGElement, BpmnEndEventTimerProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5V22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22V19.5C16.1421 19.5 19.5 16.1421 19.5 12Z" fill="currentColor"/>
<path d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16L11.7939 15.9951C9.68056 15.8879 8 14.14 8 12C8 9.79087 9.79087 8.00001 12 8ZM12 9.5C10.6193 9.50001 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM12.5 10.2949L12.5 12.0166L13.5 12.5586L13 13.5L11.5 12.5898L11.5 10.2949H12.5Z" fill="currentColor"/>
    </svg>
  )
);

BpmnEndEventTimer.displayName = 'BpmnEndEventTimer';

export default BpmnEndEventTimer;
