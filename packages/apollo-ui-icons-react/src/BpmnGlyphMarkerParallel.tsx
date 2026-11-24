// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-marker-parallel.svg
import React from 'react';

export interface BpmnGlyphMarkerParallelProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphMarkerParallel = React.forwardRef<SVGSVGElement, BpmnGlyphMarkerParallelProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M3 2.66667H5V13.3334H3V2.66667Z" fill="currentColor" />
<path d="M7 2.66667H9V13.3334H7V2.66667Z" fill="currentColor" />
<path d="M13 2.66667H11V13.3334H13V2.66667Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphMarkerParallel.displayName = 'BpmnGlyphMarkerParallel';

export default BpmnGlyphMarkerParallel;
