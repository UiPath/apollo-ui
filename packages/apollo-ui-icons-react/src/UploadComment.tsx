// Auto-generated from studio-icons/upload-comment.svg
import React from 'react';

export interface UploadCommentProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UploadComment = React.forwardRef<SVGSVGElement, UploadCommentProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M18 23L18 18.99L15 18.99L19 15L23 18.99L20 18.99L20 23L18 23Z" fill="#1976D2"/>
<path d="M2 4C2 2.9 2.9 2 4 2H20C21.1 2 22 2.9 22 4V13H20V4H4V17.17L5.17 16H14V18H6L2 22V4Z" fill="currentColor"/>
    </svg>
  )
);

UploadComment.displayName = 'UploadComment';

export default UploadComment;
