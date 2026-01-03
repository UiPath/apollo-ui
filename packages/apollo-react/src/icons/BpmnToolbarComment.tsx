// Auto-generated from ui-bpmn-canvas/bpmn-toolbar/bpmn-toolbar-comment.svg
import React from 'react';

export interface BpmnToolbarCommentProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnToolbarComment = React.forwardRef<SVGSVGElement, BpmnToolbarCommentProps>(
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
        d="M20 4C21.1 4 22 4.9 22 6V24L18 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20ZM3.5 5.5V18.5H18.5L20.5 20.5V5.5H3.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

BpmnToolbarComment.displayName = 'BpmnToolbarComment';

export default BpmnToolbarComment;
