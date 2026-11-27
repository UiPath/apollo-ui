// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-compensation-throw.svg
import React from 'react';

export interface BpmnGlyphEventCompensationThrowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventCompensationThrow = React.forwardRef<SVGSVGElement, BpmnGlyphEventCompensationThrowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.33331 16L15.6666 8V24L4.33331 16ZM16.3333 16L27.6666 8V24L16.3333 16Z" />
    </svg>
  )
);

BpmnGlyphEventCompensationThrow.displayName = 'BpmnGlyphEventCompensationThrow';

export default BpmnGlyphEventCompensationThrow;
