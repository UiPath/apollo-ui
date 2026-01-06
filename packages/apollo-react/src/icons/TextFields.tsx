// Auto-generated from editor/text-fields.svg
import React from 'react';

export interface TextFieldsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TextFields = React.forwardRef<SVGSVGElement, TextFieldsProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2.5 4.5V7.5H7.5V19.5H10.5V7.5H15.5V4.5H2.5ZM21.5 9.5H12.5V12.5H15.5V19.5H18.5V12.5H21.5V9.5Z" fill="currentColor"/>
    </svg>
  )
);

TextFields.displayName = 'TextFields';

export default TextFields;
