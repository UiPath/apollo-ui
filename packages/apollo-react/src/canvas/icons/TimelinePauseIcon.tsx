export const TimelinePauseIcon = ({
  w = 24,
  h = 25,
  color = '#526069',
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg
      data-testid="timeline-pause-icon"
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox="0 0 24 25"
      fill="none"
    >
      <path
        d="M12 2.5C17.52 2.5 22 6.98 22 12.5C22 18.02 17.52 22.5 12 22.5C6.48 22.5 2 18.02 2 12.5C2 6.98 6.48 2.5 12 2.5ZM12 4.5C7.59 4.5 4 8.09 4 12.5C4 16.91 7.59 20.5 12 20.5C16.41 20.5 20 16.91 20 12.5C20 8.09 16.41 4.5 12 4.5ZM11 16.5H9V8.5H11V16.5ZM15 8.5V16.5H13V8.5H15Z"
        fill={color}
      />
    </svg>
  );
};
