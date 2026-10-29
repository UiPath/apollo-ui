// Auto-generated from studio-activities-icon-sets/ui-data-extraction/ui-data-extraction-extract-text.svg
import React from 'react';

export interface UIDataExtractionExtractTextProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 25
   */
  size?: string | number;
}

export const UIDataExtractionExtractText = React.forwardRef<SVGSVGElement, UIDataExtractionExtractTextProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 25} height={size ?? 25}>
      <path d="M20 15.1177L20 19.1277L23 19.1277L19 23.1177L15 19.1277L18 19.1277L18 15.1177L20 15.1177Z" fill="#1976D2"/>
<path d="M20 2.11768H4V6.11768H6V4.11768H11V19.1177H9V21.1177H13V4.11768H18V6.11768H20V2.11768Z" fill="currentColor"/>
    </svg>
  )
);

UIDataExtractionExtractText.displayName = 'UIDataExtractionExtractText';

export default UIDataExtractionExtractText;
