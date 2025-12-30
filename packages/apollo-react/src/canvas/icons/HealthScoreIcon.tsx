export const HealthScoreIcon = ({
  w = 48,
  h = 48,
  color = 'var(--color-foreground-de-emp)',
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 16 16" fill="none">
      <path
        d="M7.99992 14.1161L7.03325 13.2361C3.59992 10.1228 1.33325 8.06948 1.33325 5.54948C1.33325 3.49615 2.94659 1.88281 4.99992 1.88281C6.15992 1.88281 7.27325 2.42281 7.99992 3.27615C8.72659 2.42281 9.83992 1.88281 10.9999 1.88281C13.0533 1.88281 14.6666 3.49615 14.6666 5.54948C14.6666 8.06948 12.3999 10.1228 8.96659 13.2428L7.99992 14.1161Z"
        fill={color}
      />
    </svg>
  );
};
