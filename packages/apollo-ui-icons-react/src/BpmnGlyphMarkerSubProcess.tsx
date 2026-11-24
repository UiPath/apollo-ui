// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-marker-sub-process.svg
import React from 'react';

export interface BpmnGlyphMarkerSubProcessProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphMarkerSubProcess = React.forwardRef<SVGSVGElement, BpmnGlyphMarkerSubProcessProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path stroke="currentColor" d="M3.5 3.5h9v9h-9z" />
<path fill="currentColor" fillRule="evenodd" d="M11 7.571H8.429V5H7.57v2.571H5v.858h2.571V11h.858V8.429H11V7.57Z" clipRule="evenodd" />
    </svg>
  )
);

BpmnGlyphMarkerSubProcess.displayName = 'BpmnGlyphMarkerSubProcess';

export default BpmnGlyphMarkerSubProcess;
