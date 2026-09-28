import { BaseIcon } from './BaseIcon';

type AnalyzeIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

export const AnalyzeIcon = ({
  width = 24,
  height = 24,
  color = '#526069',
  className,
}: AnalyzeIconProps) => {
  return (
    <BaseIcon
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      testId="analyze-icon"
    >
      <path
        d="M12.8916 20.7783H11.1133V3H12.8916V20.7783ZM16.4463 17.2236H14.668V6.55566H16.4463V17.2236ZM9.33301 17.2227H7.55469V6.55566H9.33301V17.2227ZM5.77832 13.667H4V10.1113H5.77832V13.667ZM20.001 10.1113V13.667H18.2227V10.1113H20.001Z"
        fill={color}
      />
    </BaseIcon>
  );
};
