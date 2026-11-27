// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-task-receive.svg
import React from 'react';

export interface BpmnGlyphTaskReceiveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphTaskReceive = React.forwardRef<SVGSVGElement, BpmnGlyphTaskReceiveProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M24 24H0V0H24V24Z" stroke="none" />
<path d="M20 4C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20ZM12 13L3.5 7V18.5H20.5V7L12 13ZM12 11.5L20.5 5.5H3.5L12 11.5Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphTaskReceive.displayName = 'BpmnGlyphTaskReceive';

export default BpmnGlyphTaskReceive;
