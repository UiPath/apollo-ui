// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-link-catch.svg
import React from 'react';

export interface BpmnGlyphEventLinkCatchProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventLinkCatch = React.forwardRef<SVGSVGElement, BpmnGlyphEventLinkCatchProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M14.2104 21.9259L14.2104 29.3333L30.6667 16L14.2104 2.66663L14.2104 10.074L2.66669 10.074L2.66669 21.9259L14.2104 21.9259ZM5.33335 19.2592L16.8771 19.2592L16.8771 23.7406L26.4307 16L16.8771 8.25934L16.8771 12.7407L5.33335 12.7407L5.33335 19.2592Z" />
    </svg>
  )
);

BpmnGlyphEventLinkCatch.displayName = 'BpmnGlyphEventLinkCatch';

export default BpmnGlyphEventLinkCatch;
