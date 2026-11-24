// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-task-send.svg
import React from 'react';

export interface BpmnGlyphTaskSendProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphTaskSend = React.forwardRef<SVGSVGElement, BpmnGlyphTaskSendProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M24 24H0V0H24V24Z" />
<path fillRule="evenodd" clipRule="evenodd" d="M20 4C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20ZM12 11L20.5 5.5V7L12 12.5L3.5 7V5.5L12 11Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphTaskSend.displayName = 'BpmnGlyphTaskSend';

export default BpmnGlyphTaskSend;
