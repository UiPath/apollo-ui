export const ReturnToOriginIcon = ({
  w = 16,
  h = 16,
}: {
  w?: number | string;
  h?: number | string;
}) => (
  <svg width={w} height={h} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.00016 6.66665L2.66683 9.99998M2.66683 9.99998L6.00016 13.3333M2.66683 9.99998H9.66683C10.6393 9.99998 11.5719 9.61367 12.2596 8.92604C12.9472 8.2384 13.3335 7.30577 13.3335 6.33331C13.3335 5.8518 13.2387 5.375 13.0544 4.93014C12.8701 4.48528 12.6 4.08107 12.2596 3.74059C11.5719 3.05295 10.6393 2.66665 9.66683 2.66665H7.3335"
      stroke="currentColor"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
