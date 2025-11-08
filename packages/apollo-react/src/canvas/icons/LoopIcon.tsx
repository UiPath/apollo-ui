export const LoopIcon = ({
  w = 48,
  h = 48,
  color = "var(--color-foreground-de-emp)",
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 24 24" fill="none">
      <path
        d="M9.01 1V4L3 4C1.89543 4 1 4.89543 1 6V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V6C23 4.89543 22.1046 4 21 4H17V6H21V19H3V6L9.01 6L9.01 9L13 5L9.01 1Z"
        fill={color}
      />
    </svg>
  );
};
