export const PatternsIcon = ({ w = 24, h = 24 }: { w?: number | string; h?: number | string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 24 24" fill="none">
    <rect x="6" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    {/* Background fill lets each card occlude the one behind it. */}
    <rect
      x="4"
      y="6"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="var(--color-background, transparent)"
    />
    <rect
      x="2"
      y="9"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="var(--color-background, transparent)"
    />
  </svg>
);
