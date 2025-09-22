export const TimelineProgressIcon = ({
  w = 10,
  h = 10,
  color = "#0067DF",
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg data-testid="timeline-progress-icon" xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 10 10" fill="none">
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  );
};
