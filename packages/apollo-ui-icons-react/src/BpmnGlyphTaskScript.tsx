// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-task-script.svg
import React from 'react';

export interface BpmnGlyphTaskScriptProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphTaskScript = React.forwardRef<SVGSVGElement, BpmnGlyphTaskScriptProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M24 24H0V0H24V24Z" stroke="none" />
<path d="M7 3C5.89543 3 5 3.89543 5 5V15H6.5V4.5H17.5V17.0006C17.5 18.1052 17.0646 19.5 15.5 19.5C14 19.5 13 18.6046 13 17.5H2C2 19.7091 3.78991 21 5.99905 21H15.5C17.7091 21 19 19.2098 19 17.0006V6.5H22V5C22 3.89543 21.1046 3 20 3H7Z" fill="currentColor" />
<path d="M9 7H15V9H9V7Z" fill="currentColor" />
<path d="M15 11H9V13H15V11Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphTaskScript.displayName = 'BpmnGlyphTaskScript';

export default BpmnGlyphTaskScript;
