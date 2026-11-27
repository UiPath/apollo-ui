// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-compensation-catch.svg
import React from 'react';

export interface BpmnGlyphEventCompensationCatchProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventCompensationCatch = React.forwardRef<SVGSVGElement, BpmnGlyphEventCompensationCatchProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.33331 16L15.6666 8V24L4.33331 16ZM27.6666 8L16.3333 16L27.6666 24V8ZM8.95998 16L13 18.8533V13.1467L8.95998 16ZM20.96 16L25 18.8533V13.1467L20.96 16Z" />
    </svg>
  )
);

BpmnGlyphEventCompensationCatch.displayName = 'BpmnGlyphEventCompensationCatch';

export default BpmnGlyphEventCompensationCatch;
