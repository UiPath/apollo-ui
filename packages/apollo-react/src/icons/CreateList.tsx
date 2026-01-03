// Auto-generated from studio-icons/create-list.svg
import React from 'react';

export interface CreateListProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CreateList = React.forwardRef<SVGSVGElement, CreateListProps>(
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
      <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor" />
      <path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108" />
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H7V4L4 4V20H7V22H4C2.89543 22 2 21.1046 2 20V4Z"
        fill="currentColor"
      />
      <path d="M22 4C22 2.89543 21.1046 2 20 2H17V4L20 4V13H22V4Z" fill="currentColor" />
    </svg>
  )
);

CreateList.displayName = 'CreateList';

export default CreateList;
