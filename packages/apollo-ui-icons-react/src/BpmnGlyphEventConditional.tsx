// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-conditional.svg
import React from 'react';

export interface BpmnGlyphEventConditionalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventConditional = React.forwardRef<SVGSVGElement, BpmnGlyphEventConditionalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M26.8 4H5.2C4.53333 4 4 4.53333 4 5.2V26.8C4 27.3333 4.53333 28 5.2 28H26.8C27.3333 28 28 27.3333 28 26.8V5.2C28 4.53333 27.3333 4 26.8 4ZM12 9.33333H9.33333V12H12V9.33333ZM22.6667 9.33333H14.6667V12H22.6667V9.33333ZM22.6667 14.6667H14.6667V17.3333H22.6667V14.6667ZM14.6667 20H22.6667V22.6667H14.6667V20ZM9.33333 14.6667H12V17.3333H9.33333V14.6667ZM12 20H9.33333V22.6667H12V20ZM6.66667 25.3333H25.3333V6.66667H6.66667V25.3333Z" />
    </svg>
  )
);

BpmnGlyphEventConditional.displayName = 'BpmnGlyphEventConditional';

export default BpmnGlyphEventConditional;
