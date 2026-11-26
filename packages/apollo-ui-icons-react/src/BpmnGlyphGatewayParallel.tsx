// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-gateway-parallel.svg
import React from 'react';

export interface BpmnGlyphGatewayParallelProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphGatewayParallel = React.forwardRef<SVGSVGElement, BpmnGlyphGatewayParallelProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M7.92868 10.0713H0V7.92868H7.92868V0H10.0713V7.92868H18V10.0713H10.0713V18H7.92868V10.0713Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphGatewayParallel.displayName = 'BpmnGlyphGatewayParallel';

export default BpmnGlyphGatewayParallel;
