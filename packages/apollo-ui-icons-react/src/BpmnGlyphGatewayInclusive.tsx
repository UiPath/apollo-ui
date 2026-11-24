// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-gateway-inclusive.svg
import React from 'react';

export interface BpmnGlyphGatewayInclusiveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphGatewayInclusive = React.forwardRef<SVGSVGElement, BpmnGlyphGatewayInclusiveProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
);

BpmnGlyphGatewayInclusive.displayName = 'BpmnGlyphGatewayInclusive';

export default BpmnGlyphGatewayInclusive;
