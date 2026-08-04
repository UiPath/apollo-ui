export const EarlyExitStatusIcon = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
      }}
      data-testid="early-exit-status-icon"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.45792 4.39058C9.61909 4.20282 9.88073 4.20281 10.0419 4.39058L14.1288 9.15914C14.2899 9.34713 14.2897 9.6517 14.1288 9.8398L10.0419 14.6084C9.88068 14.7965 9.61914 14.7964 9.45792 14.6084L5.371 9.8398C5.21006 9.6517 5.20992 9.34713 5.371 9.15914L9.45792 4.39058Z"
          fill="var(--color-foreground)"
        />
        <circle
          cx="9.75"
          cy="9.75"
          r="9"
          stroke="var(--color-success-icon)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 6"
        />
      </svg>
    </div>
  );
};
