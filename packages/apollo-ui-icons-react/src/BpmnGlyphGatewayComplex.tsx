// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-gateway-complex.svg
import React from 'react';

export interface BpmnGlyphGatewayComplexProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphGatewayComplex = React.forwardRef<SVGSVGElement, BpmnGlyphGatewayComplexProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M7.42336 18L7.68613 11.125L1.57664 14.8125L0 12.1875L6.43796 9L0 5.8125L1.57664 3.1875L7.68613 6.875L7.42336 0H10.5766L10.3139 6.875L16.4234 3.1875L18 5.8125L11.562 9L18 12.1875L16.4234 14.8125L10.3139 11.125L10.5766 18H7.42336Z" />
    </svg>
  )
);

BpmnGlyphGatewayComplex.displayName = 'BpmnGlyphGatewayComplex';

export default BpmnGlyphGatewayComplex;
