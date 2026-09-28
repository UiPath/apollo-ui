// Auto-generated from studio-icons/list-hosts.svg
import React from 'react';

export interface ListHostsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ListHosts = React.forwardRef<SVGSVGElement, ListHostsProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M15 17H22V19H15V17Z" fill="#1976D2"/>
<path d="M22 20H15V22H22V20Z" fill="#1976D2"/>
<path d="M20 2H4C2.90039 2 2 2.8999 2 4V15C2 16.1001 2.90039 17 4 17H11V19H8V21H13V15H4V4H20V15H22V4C22 2.8999 21.0996 2 20 2Z" fill="currentColor"/>
<circle cx="12" cy="20" r="2" fill="currentColor"/>
<rect x="2" y="19" width="8" height="2" fill="currentColor"/>
    </svg>
  )
);

ListHosts.displayName = 'ListHosts';

export default ListHosts;
