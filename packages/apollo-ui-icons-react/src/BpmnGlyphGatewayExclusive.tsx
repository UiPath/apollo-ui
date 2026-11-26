// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-gateway-exclusive.svg
import React from 'react';

export interface BpmnGlyphGatewayExclusiveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphGatewayExclusive = React.forwardRef<SVGSVGElement, BpmnGlyphGatewayExclusiveProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M1.52522 18L0 16.4748L7.47445 9L0 1.52523L1.52522 0L9 7.47445L16.4748 0L18 1.52523L10.5255 9L18 16.4748L16.4748 18L9 10.5256L1.52522 18Z" />
    </svg>
  )
);

BpmnGlyphGatewayExclusive.displayName = 'BpmnGlyphGatewayExclusive';

export default BpmnGlyphGatewayExclusive;
