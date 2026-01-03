// Auto-generated from object/document.svg
import React from 'react';

export interface DocumentProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Document = React.forwardRef<SVGSVGElement, DocumentProps>(
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
        d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H5.99C4.89 22 4 21.1 4 20L4.01 4C4.01 2.9 4.9 2 6 2ZM6 4V20H18V9H13V4H6ZM8 15.8936H16V17.8936H8V15.8936ZM16 11.8936H8V13.8936H16V11.8936Z"
        fill="currentColor"
      />
    </svg>
  )
);

Document.displayName = 'Document';

export default Document;
