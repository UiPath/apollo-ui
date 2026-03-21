interface DashboardGlowProps {
  startColor?: string;
  endColor?: string;
  className?: string;
}

export function DashboardGlow({
  startColor = "#6C5AEF",
  endColor = "#69C7DD",
  className,
}: DashboardGlowProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-visible opacity-30 dark:opacity-60 ${className ?? ""}`}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1576 818"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#glow-blur)">
          <path
            d="M541.705 724.362L75 257.99L87.1579 127.101L482.877 75L916.638 102.957L1501 84.319L1388.44 421.919L1314.32 743L847.613 651.928L541.705 724.362Z"
            fill="url(#glow-gradient)"
            fillOpacity="0.3"
          />
        </g>
        <defs>
          <filter
            id="glow-blur"
            x="0"
            y="0"
            width="1576"
            height="818"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="37.5"
              result="effect1_foregroundBlur"
            />
          </filter>
          <linearGradient
            id="glow-gradient"
            x1="607.918"
            y1="95.3798"
            x2="1538.15"
            y2="838.957"
            gradientUnits="userSpaceOnUse"
          >
            <stop style={{ stopColor: startColor }} />
            <stop offset="1" style={{ stopColor: endColor }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
