type ProcessIconProps = {
  width?: number | string;
  height?: number | string;
  primaryColor?: string;
  secondaryColor?: string;
  variant?: 'default' | 'filled';
};

export const ProcessIcon = ({
  width = 24,
  height = 24,
  primaryColor = '#526069',
  secondaryColor = '#0067DF',
  variant = 'default',
}: ProcessIconProps) => {
  const iconPrimaryColor = variant === 'filled' ? '#FFFFFF' : primaryColor;
  const iconSecondaryColor = variant === 'filled' ? '#FFFFFF' : secondaryColor;

  return (
    <svg
      fill="none"
      height={height}
      viewBox="0 0 24 25"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'filled' && <circle cx="12" cy="12.5" r="12" fill={secondaryColor} />}
      <g
        transform={
          variant === 'filled' ? 'translate(12, 12.5) scale(0.7) translate(-12, -12.5)' : undefined
        }
      >
        <path
          clipRule="evenodd"
          d="M4.50113 5.32211L4.50591 11.6564L10.8403 11.6517L10.8355 5.31733L4.50113 5.32211ZM3.75 3.82268C3.33579 3.82299 3.00025 4.15903 3.00057 4.57324L3.00648 12.4076C3.00679 12.8218 3.34283 13.1573 3.75705 13.157L11.5914 13.1511C12.0056 13.1508 12.3411 12.8147 12.3408 12.4005L12.3349 4.56619C12.3346 4.15198 11.9986 3.81645 11.5843 3.81676L3.75 3.82268Z"
          fill={iconPrimaryColor}
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M16.6761 20.6601C18.427 20.6588 19.8452 19.2384 19.8439 17.4875C19.8426 15.7367 18.4222 14.3184 16.6713 14.3197C14.9205 14.321 13.5022 15.7415 13.5035 17.4923C13.5048 19.2431 14.9253 20.6614 16.6761 20.6601ZM21.3439 17.4864C21.3458 20.0657 19.2565 22.1581 16.6772 22.1601C14.098 22.162 12.0055 20.0727 12.0035 17.4934C12.0016 14.9142 14.0909 12.8217 16.6702 12.8197C19.2495 12.8178 21.342 14.9071 21.3439 17.4864Z"
          fill={iconPrimaryColor}
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M5.25 15.0732C5.66421 15.0732 6 15.409 6 15.8232V19.5732H9.75C10.1642 19.5732 10.5 19.909 10.5 20.3232C10.5 20.7375 10.1642 21.0732 9.75 21.0732H5.25C4.83579 21.0732 4.5 20.7375 4.5 20.3232V15.8232C4.5 15.409 4.83579 15.0732 5.25 15.0732Z"
          fill={iconSecondaryColor}
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M19.5 11.3232C19.0858 11.3232 18.75 10.9875 18.75 10.5732V6.82324H15C14.5858 6.82324 14.25 6.48746 14.25 6.07324C14.25 5.65903 14.5858 5.32324 15 5.32324H19.5C19.9142 5.32324 20.25 5.65903 20.25 6.07324V10.5732C20.25 10.9875 19.9142 11.3232 19.5 11.3232Z"
          fill={iconSecondaryColor}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
};
