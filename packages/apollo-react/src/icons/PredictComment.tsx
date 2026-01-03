// Auto-generated from studio-icons/predict-comment.svg
import React from 'react';

export interface PredictCommentProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PredictComment = React.forwardRef<SVGSVGElement, PredictCommentProps>(
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
        d="M18.5 14C18.3088 14 18.1554 14.1555 18.1396 14.3461C17.9732 16.3642 16.3645 17.9732 14.3461 18.1396C14.1555 18.1554 14 18.3088 14 18.5C14 18.6912 14.1555 18.8446 14.3461 18.8604C16.3645 19.0268 17.9732 20.6358 18.1396 22.6539C18.1554 22.8445 18.3088 23 18.5 23C18.6912 23 18.8446 22.8445 18.8604 22.6539C19.0268 20.6358 20.6355 19.0268 22.6539 18.8604C22.8445 18.8446 23 18.6912 23 18.5C23 18.3088 22.8445 18.1554 22.6539 18.1396C20.6355 17.9732 19.0268 16.3642 18.8604 14.3461C18.8446 14.1555 18.6912 14 18.5 14Z"
        fill="#1976D2"
      />
      <path
        d="M2 4C2 2.9 2.9 2 4 2H20C21.1 2 22 2.9 22 4V14H20V4H4V17.17L5.17 16H12V18H6L2 22V4Z"
        fill="currentColor"
      />
    </svg>
  )
);

PredictComment.displayName = 'PredictComment';

export default PredictComment;
