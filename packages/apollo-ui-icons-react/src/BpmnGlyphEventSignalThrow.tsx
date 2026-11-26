// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-signal-throw.svg
import React from 'react';

export interface BpmnGlyphEventSignalThrowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventSignalThrow = React.forwardRef<SVGSVGElement, BpmnGlyphEventSignalThrowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M15.1259 5.57348C15.5069 4.88767 16.4932 4.88767 16.8742 5.57348L28.508 26.5144C28.8783 27.1809 28.3963 28 27.6338 28H4.3662C3.60372 28 3.12175 27.1809 3.49204 26.5144L15.1259 5.57348Z" />
    </svg>
  )
);

BpmnGlyphEventSignalThrow.displayName = 'BpmnGlyphEventSignalThrow';

export default BpmnGlyphEventSignalThrow;
