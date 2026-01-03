// Auto-generated from ui-bpmn-canvas/bpmn-participant/bpmn-participant-participant.svg
import React from 'react';

export interface BpmnParticipantParticipantProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnParticipantParticipant = React.forwardRef<
  SVGSVGElement,
  BpmnParticipantParticipantProps
>(({ size, ...props }, ref) => (
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20.5 6C20.5 5.72386 20.2761 5.5 20 5.5H4C3.72386 5.5 3.5 5.72386 3.5 6V18C3.5 18.2761 3.72386 18.5 4 18.5H20C20.2761 18.5 20.5 18.2761 20.5 18V6ZM4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 19L5.5 5L7 5L7 19H5.5Z"
      fill="currentColor"
    />
  </svg>
));

BpmnParticipantParticipant.displayName = 'BpmnParticipantParticipant';

export default BpmnParticipantParticipant;
