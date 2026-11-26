// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-message-throw.svg
import React from 'react';

export interface BpmnGlyphEventMessageThrowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventMessageThrow = React.forwardRef<SVGSVGElement, BpmnGlyphEventMessageThrowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M26.6667 5.33334C28.1334 5.33334 29.3334 6.53334 29.3334 8V24C29.3334 25.4667 28.1334 26.6667 26.6667 26.6667H5.33335C3.86669 26.6667 2.66669 25.4667 2.66669 24V8C2.66669 6.53334 3.86669 5.33334 5.33335 5.33334H26.6667ZM16 14.3976L26.6667 7.28648V10.4914L16 17.6025L5.33335 10.4914V7.28646L16 14.3976Z" />
    </svg>
  )
);

BpmnGlyphEventMessageThrow.displayName = 'BpmnGlyphEventMessageThrow';

export default BpmnGlyphEventMessageThrow;
