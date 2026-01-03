// Auto-generated from ui-bpmn-canvas/bpmn-end-event/bpmn-end-event-signal-catch.svg
import React from 'react';

export interface BpmnEndEventSignalCatchProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnEndEventSignalCatch = React.forwardRef<
  SVGSVGElement,
  BpmnEndEventSignalCatchProps
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
      d="M19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5V22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22V19.5C16.1421 19.5 19.5 16.1421 19.5 12Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.2346 8.04831C12.1578 7.91532 11.966 7.91489 11.8886 8.04753L8.17635 14.4117C8.09838 14.5454 8.19525 14.7131 8.35 14.7124L15.7176 14.6796C15.8711 14.679 15.9666 14.5126 15.8899 14.3796L12.2346 8.04831ZM12.087 10.4011C12.0485 10.3341 11.9518 10.3343 11.9135 10.4014L10.1651 13.464L13.6766 13.464C13.7535 13.464 13.8016 13.3808 13.7633 13.3141L12.087 10.4011Z"
      fill="currentColor"
    />
  </svg>
));

BpmnEndEventSignalCatch.displayName = 'BpmnEndEventSignalCatch';

export default BpmnEndEventSignalCatch;
