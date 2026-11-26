// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-link-throw.svg
import React from 'react';

export interface BpmnGlyphEventLinkThrowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventLinkThrow = React.forwardRef<SVGSVGElement, BpmnGlyphEventLinkThrowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2.66669 10.074L14.2104 10.074L14.2104 2.66663L30.6667 16L14.2104 29.3333L14.2104 21.9259L2.66669 21.9259L2.66669 10.074Z" />
    </svg>
  )
);

BpmnGlyphEventLinkThrow.displayName = 'BpmnGlyphEventLinkThrow';

export default BpmnGlyphEventLinkThrow;
