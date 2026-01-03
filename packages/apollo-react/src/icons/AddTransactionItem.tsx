// Auto-generated from studio-icons/add-transaction-item.svg
import React from 'react';

export interface AddTransactionItemProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AddTransactionItem = React.forwardRef<SVGSVGElement, AddTransactionItemProps>(
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
      <path d="M19 14H17V17H14V19H17V22H19V19H22V17H19V14Z" fill="#038108" />
      <path
        d="M3 5L15.01 5V2L19 6L15.01 10L15.01 7L3 7V19C1.89543 19 1 18.1046 1 17V7C1 5.89543 1.89543 5 3 5Z"
        fill="currentColor"
      />
      <path d="M23 7C23 5.89543 22.1046 5 21 5V15H23V7Z" fill="currentColor" />
      <path d="M12 19V17H8.99L8.99 14L5 18L8.99 22V19H12Z" fill="currentColor" />
    </svg>
  )
);

AddTransactionItem.displayName = 'AddTransactionItem';

export default AddTransactionItem;
