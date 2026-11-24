// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-gateway-event-based.svg
import React from 'react';

export interface BpmnGlyphGatewayEventBasedProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphGatewayEventBased = React.forwardRef<SVGSVGElement, BpmnGlyphGatewayEventBasedProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <circle cx="9" cy="9" r="8.5" stroke="currentColor" />
<circle cx="9" cy="9" r="6.5" stroke="currentColor" />
<path d="M4.83844 7.51713L9 4.60987L13.1616 7.51713L11.5801 12.1971H6.41989L4.83844 7.51713Z" stroke="currentColor" />
    </svg>
  )
);

BpmnGlyphGatewayEventBased.displayName = 'BpmnGlyphGatewayEventBased';

export default BpmnGlyphGatewayEventBased;
