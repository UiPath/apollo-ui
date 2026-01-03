// Auto-generated from action/email-draft.svg
import React from 'react';

export interface EmailDraftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const EmailDraft = React.forwardRef<SVGSVGElement, EmailDraftProps>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.99 9.5C21.99 8.78 21.62 8.15 21.05 7.8L12 2.5L2.95 7.8C2.38 8.15 2 8.78 2 9.5V19.5C2 20.6 2.9 21.5 4 21.5H20C21.1 21.5 22 20.6 22 19.5L21.99 9.5ZM19.99 9.5V9.51L12 14.5L4 9.5L12 4.82L19.99 9.5ZM4 11.84V19.5H20L19.99 11.87L12 16.86L4 11.84Z"
        fill="currentColor"
      />
    </svg>
  )
);

EmailDraft.displayName = 'EmailDraft';

export default EmailDraft;
