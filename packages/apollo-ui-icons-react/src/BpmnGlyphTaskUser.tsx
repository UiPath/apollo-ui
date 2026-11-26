// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-task-user.svg
import React from 'react';

export interface BpmnGlyphTaskUserProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphTaskUser = React.forwardRef<SVGSVGElement, BpmnGlyphTaskUserProps>(
  ({ size, ...props }, ref) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M24 24H0V0H24V24Z" stroke="none" />
<path fillRule="evenodd" clipRule="evenodd" d="M7 7.99957C7 5.23816 9.2388 2.99957 12.0002 2.99957C14.7617 2.99957 17 5.23816 17 7.99957C17 10.761 14.7701 12.9996 12.0087 12.9996C9.24725 12.9996 7 10.761 7 7.99957ZM12 4.49982C10.4659 4.49982 8.5 5.49982 8.5 7.99957C8.5 10.4993 10.4745 11.4998 12.0087 11.4998C13.5428 11.4998 15.5 10.4993 15.5 7.99957C15.5 5.49982 13.5341 4.49982 12 4.49982ZM12.0087 14C16.0174 14 20.9963 16.0904 21 20.9996L19.5 20.9998C19.4972 17.3179 15.6819 15.4972 12 15.5C8.31804 15.5028 4.49714 17.318 4.5 20.9998L3 20.9996C2.9962 16.0903 8 14 12.0087 14Z" fill="currentColor" />
    </svg>
  )
);

BpmnGlyphTaskUser.displayName = 'BpmnGlyphTaskUser';

export default BpmnGlyphTaskUser;
