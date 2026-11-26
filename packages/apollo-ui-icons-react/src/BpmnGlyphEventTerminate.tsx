// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-terminate.svg
import React from 'react';

export interface BpmnGlyphEventTerminateProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventTerminate = React.forwardRef<SVGSVGElement, BpmnGlyphEventTerminateProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <circle cx="16" cy="16" r="13.3333" />
    </svg>
  )
);

BpmnGlyphEventTerminate.displayName = 'BpmnGlyphEventTerminate';

export default BpmnGlyphEventTerminate;
