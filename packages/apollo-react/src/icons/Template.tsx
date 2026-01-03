// Auto-generated from object/template.svg
import React from 'react';

export interface TemplateProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Template = React.forwardRef<SVGSVGElement, TemplateProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        d="M7.99939 2H15.9994L21.9994 8V20C21.9994 21.1046 21.1049 22 19.9994 22H7.99939V20H19.9994V9H14.9994V4H7.99939V6H6L6.00916 4C6.00916 2.90002 6.89978 2 7.99939 2Z"
        fill="currentColor"
      />
      <path d="M4 8H11V10H4V8Z" fill="currentColor" />
      <path d="M2 12H9V14H2V12Z" fill="currentColor" />
      <path d="M13 16H6V18H13V16Z" fill="currentColor" />
    </svg>
  )
);

Template.displayName = 'Template';

export default Template;
