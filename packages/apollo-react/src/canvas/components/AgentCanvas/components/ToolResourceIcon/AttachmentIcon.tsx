import { BaseIcon } from './BaseIcon';

interface AttachmentIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const AttachmentIcon = ({
  width = 24,
  height = 24,
  color = '#526069',
  className,
}: AttachmentIconProps) => {
  return (
    <BaseIcon
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      testId="attachment-icon"
    >
      <path
        d="M19.5479 7.09961C21.813 7.09961 23.6482 8.93417 23.6484 11.1992C23.6484 13.4644 21.8131 15.2998 19.5479 15.2998H9.04785C7.6128 15.2996 6.44824 14.1343 6.44824 12.6992C6.44845 11.2643 7.61293 10.0998 9.04785 10.0996H18.6484V11.7998H9.04785C8.55339 11.8 8.14865 12.2048 8.14844 12.6992C8.14844 13.1939 8.55326 13.5994 9.04785 13.5996H19.5479C20.8726 13.5996 21.9482 12.524 21.9482 11.1992C21.948 9.87463 20.8725 8.7998 19.5479 8.7998H7.04785C4.89339 8.80002 3.14865 10.5448 3.14844 12.6992C3.14844 14.8539 4.89326 16.5994 7.04785 16.5996H18.6484V18.2998H7.04785C3.9528 18.2996 1.44824 15.7943 1.44824 12.6992C1.44845 9.6043 3.95293 7.09982 7.04785 7.09961H19.5479Z"
        fill={color}
      />
    </BaseIcon>
  );
};
