// Auto-generated from editor/group.svg
import React from 'react';

export interface GroupProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Group = React.forwardRef<SVGSVGElement, GroupProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2.8335 2.83331V6.16665H3.66683V17.8333H2.8335V21.1666H6.16683V20.3333H17.8335V21.1666H21.1668V17.8333H20.3335V6.16665H21.1668V2.83331H17.8335V3.66665H6.16683V2.83331M6.16683 5.33331H17.8335V6.16665H18.6668V17.8333H17.8335V18.6666H6.16683V17.8333H5.3335V6.16665H6.16683M7.00016 6.99998V13.6666H9.50016V17H17.0002V9.49998H13.6668V6.99998M8.66683 8.66665H12.0002V12H8.66683M13.6668 11.1666H15.3335V15.3333H11.1668V13.6666H13.6668" fill="currentColor"/>
    </svg>
  )
);

Group.displayName = 'Group';

export default Group;
