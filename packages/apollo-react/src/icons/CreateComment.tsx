// Auto-generated from studio-icons/create-comment.svg
import React from 'react';

export interface CreateCommentProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CreateComment = React.forwardRef<SVGSVGElement, CreateCommentProps>(
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
      <path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108" />
      <path
        d="M2 4C2 2.9 2.9 2 4 2H20C21.1 2 22 2.9 22 4V13H20V4H4V17.17L5.17 16H13V18H6L2 22V4Z"
        fill="currentColor"
      />
    </svg>
  )
);

CreateComment.displayName = 'CreateComment';

export default CreateComment;
