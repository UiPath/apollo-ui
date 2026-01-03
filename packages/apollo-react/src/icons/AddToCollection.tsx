// Auto-generated from studio-icons/add-to-collection.svg
import React from 'react';

export interface AddToCollectionProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AddToCollection = React.forwardRef<SVGSVGElement, AddToCollectionProps>(
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
      <path d="M23 20V18H15V20H23Z" fill="#038108" />
      <path d="M18 23H20V15H18V23Z" fill="#038108" />
      <path
        d="M15 2C16.0544 2 16.9182 2.81588 16.9945 3.85074L17 4V5H15V4H4V15H5V17H4C2.94564 17 2.08183 16.1841 2.00549 15.1493L2 15V4C2 2.94564 2.81588 2.08183 3.85074 2.00549L4 2H15Z"
        fill="currentColor"
      />
      <path
        d="M20 7C21.0544 7 21.9182 7.81588 21.9945 8.85074L22 9V13H20V9H9V20H13V22H9C7.94564 22 7.08183 21.1841 7.00549 20.1493L7 20V9C7 7.94564 7.81588 7.08183 8.85074 7.00549L9 7H20Z"
        fill="currentColor"
      />
    </svg>
  )
);

AddToCollection.displayName = 'AddToCollection';

export default AddToCollection;
