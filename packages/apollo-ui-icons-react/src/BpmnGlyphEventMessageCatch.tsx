// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-message-catch.svg
import React from 'react';

export interface BpmnGlyphEventMessageCatchProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventMessageCatch = React.forwardRef<SVGSVGElement, BpmnGlyphEventMessageCatchProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.66669 8C2.66669 6.52724 3.86059 5.33333 5.33335 5.33333H26.6667C28.1394 5.33333 29.3334 6.52724 29.3334 8V24C29.3334 25.4728 28.1394 26.6667 26.6667 26.6667H5.33335C3.86059 26.6667 2.66669 25.4728 2.66669 24V8ZM25.3334 8H6.81255L16.073 14.1736L25.3334 8ZM5.33335 10.2188V24H26.6667V10.316L16.073 17.3785L5.33335 10.2188Z" />
    </svg>
  )
);

BpmnGlyphEventMessageCatch.displayName = 'BpmnGlyphEventMessageCatch';

export default BpmnGlyphEventMessageCatch;
