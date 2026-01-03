// Auto-generated from studio-icons/set-assets.svg
import React from 'react';

export interface SetAssetsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SetAssets = React.forwardRef<SVGSVGElement, SetAssetsProps>(
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
      <path d="M18 23L18 18.99L15 18.99L19 15L23 18.99L20 18.99L20 23L18 23Z" fill="#1976D2" />
      <path
        d="M21 5.38235V11.4458L10.1934 21.1714L2 17.6597V11.5259L13.8682 1.81595L21 5.38235ZM10 15.4742V18.6538L19 10.5542V8.10989L10 15.4742ZM4 16.3404L8 18.0542V15.6177L4 13.6177V16.3404ZM4.82812 11.7954L8.86816 13.8159L18.1719 6.20364L14.1318 4.18411L4.82812 11.7954Z"
        fill="currentColor"
      />
    </svg>
  )
);

SetAssets.displayName = 'SetAssets';

export default SetAssets;
