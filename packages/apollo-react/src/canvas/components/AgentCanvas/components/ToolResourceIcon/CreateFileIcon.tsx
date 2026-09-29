import { BaseIcon } from './BaseIcon';

type CreateFileIconProps = {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

export const CreateFileIcon = ({
  width = 24,
  height = 24,
  color = '#526069',
  className,
}: CreateFileIconProps) => {
  return (
    <BaseIcon
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      testId="create-file-icon"
    >
      <path
        d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H13V20H6V4H13V9H18V13H20V8L14 2Z"
        fill={color}
      />
      <path d="M20 15H18V18H15V20H18V23H20V20H23V18H20V15Z" fill="#038108" />
    </BaseIcon>
  );
};
