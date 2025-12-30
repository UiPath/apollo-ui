interface IxpIconProps {
  width?: number | string;
  height?: number | string;
  primaryColor?: string;
  secondaryColor?: string;
  variant?: 'default' | 'filled';
}

export const IxpIcon = ({
  width = 24,
  height = 24,
  primaryColor = '#526069',
  secondaryColor = '#FF6B35',
  variant = 'default',
}: IxpIconProps) => {
  const iconPrimaryColor = variant === 'filled' ? '#FFFFFF' : primaryColor;
  const iconSecondaryColor = variant === 'filled' ? '#FFFFFF' : secondaryColor;

  return (
    <svg
      fill="none"
      height={height}
      viewBox="0 0 24 24"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'filled' && <circle cx="12" cy="12" r="12" fill={secondaryColor} />}
      <g
        transform={
          variant === 'filled' ? 'translate(12, 12) scale(0.7) translate(-12, -12)' : undefined
        }
      >
        {/* Document shape */}
        <path
          d="M6 2C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8.41421C19 8.149 18.8946 7.89464 18.7071 7.70711L13.2929 2.29289C13.1054 2.10536 12.851 2 12.5858 2H6Z"
          stroke={iconPrimaryColor}
          strokeWidth="1.5"
          fill="none"
        />
        {/* Folded corner */}
        <path
          d="M12 2V8C12 8.55228 12.4477 9 13 9H19"
          stroke={iconPrimaryColor}
          strokeWidth="1.5"
          fill="none"
        />
        {/* IXP text or document lines */}
        <path d="M8 13H16" stroke={iconSecondaryColor} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 17H13" stroke={iconSecondaryColor} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
