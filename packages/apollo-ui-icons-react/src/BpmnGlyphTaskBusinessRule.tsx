// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-task-business-rule.svg
import React from 'react';

export interface BpmnGlyphTaskBusinessRuleProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphTaskBusinessRule = React.forwardRef<SVGSVGElement, BpmnGlyphTaskBusinessRuleProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M24 24H0V0H24V24Z" stroke="none" />
<path d="M20 3C21.1 3 22 3.9 22 5V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H20ZM3.5 19.5H7.5V10H3.5V19.5ZM9 19.5H15V10H9V19.5ZM16.5 10V19.5H20.5V10H16.5ZM3.5 8.5H20.5V4.5H3.5V8.5Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphTaskBusinessRule.displayName = 'BpmnGlyphTaskBusinessRule';

export default BpmnGlyphTaskBusinessRule;
