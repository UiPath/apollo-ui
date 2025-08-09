export const AgentIcon = ({
  w = 48,
  h = 48,
  color = "var(--color-foreground-de-emp)",
}: {
  w?: number | string;
  h?: number | string;
  color?: string;
}) => {
  return (
    <svg data-testid="agent-icon" fill="none" height={h} viewBox="0 0 16 16" width={w} xmlns="http://www.w3.org/2000/svg">
      <rect height="7" rx="1.5" stroke={color} width="13.2222" x="1.38867" y="4.94434" />
      <rect fill={color} height="2.22222" rx="0.666667" width="1.33333" x="7.33398" y="7.55566" />
      <rect fill={color} height="2.22222" rx="0.666667" width="1.33333" x="10.666" y="7.55566" />
      <path
        d="M6.27695 1.93526C5.95259 1.05869 4.71277 1.05869 4.38841 1.93526L3.96573 3.07755L2.82345 3.50023C1.94687 3.82459 1.94687 5.06441 2.82345 5.38877L3.96573 5.81145L4.38841 6.95373C4.71277 7.83031 5.95259 7.83031 6.27695 6.95373L6.69964 5.81145L7.84192 5.38877C8.71849 5.06441 8.71849 3.82459 7.84192 3.50023L6.69964 3.07755L6.27695 1.93526Z"
        fill="#0067DF"
        stroke="white"
      />
    </svg>
  );
};
