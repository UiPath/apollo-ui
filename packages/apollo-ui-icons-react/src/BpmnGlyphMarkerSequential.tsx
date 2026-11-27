// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-marker-sequential.svg
import React from 'react';

export interface BpmnGlyphMarkerSequentialProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphMarkerSequential = React.forwardRef<SVGSVGElement, BpmnGlyphMarkerSequentialProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2.66669 13V11H13.3334V13H2.66669Z" fill="currentColor" />
<path d="M2.66669 9V7H13.3334V9H2.66669Z" fill="currentColor" />
<path d="M2.66669 3V5H13.3334V3H2.66669Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphMarkerSequential.displayName = 'BpmnGlyphMarkerSequential';

export default BpmnGlyphMarkerSequential;
