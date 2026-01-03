// Auto-generated from studio-activities-icon-sets/activities-entities/entities-entity.svg
import React from 'react';

export interface EntitiesEntityProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const EntitiesEntity = React.forwardRef<SVGSVGElement, EntitiesEntityProps>(
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
        d="M22.8789 14.627L12 22.8115L1.11816 14.6279L2.58691 12.6738L12 19.7529L21.4092 12.6738L22.8789 14.627ZM23 9.25L12 17.5L1 9.25L12 1L23 9.25ZM5.07422 9.25L12 14.4443L18.9258 9.25L12 4.05566L5.07422 9.25Z"
        fill="currentColor"
      />
    </svg>
  )
);

EntitiesEntity.displayName = 'EntitiesEntity';

export default EntitiesEntity;
