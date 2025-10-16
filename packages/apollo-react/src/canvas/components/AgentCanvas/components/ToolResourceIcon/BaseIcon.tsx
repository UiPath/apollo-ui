export interface BaseIconProps {
  width?: number;
  height?: number;
  viewBox: string;
  className?: string;
  testId?: string;
  children: React.ReactNode;
}

export const BaseIcon = ({ width = 24, height = 24, viewBox, className, testId, children }: BaseIconProps) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid={testId}
    >
      {children}
    </svg>
  );
};
