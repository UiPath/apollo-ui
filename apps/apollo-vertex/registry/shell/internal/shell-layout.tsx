import type { PropsWithChildren } from "react";
import type { CompanyLogo } from "@/components/ui/shell";
import { useTheme } from "@/components/ui/theme-provider";
import { Sidebar } from "./sidebar";

const GRADIENT_BLUR = "blur(149.643px)";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
}

function DarkGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
      {/* ellipse 1 - top left */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="1200"
        height="1100"
        viewBox="0 0 860 810"
        fill="none"
        className="absolute"
        style={{
          top: "-100px",
          left: "-300px",
          fill: "rgba(31, 89, 117, 0.60)",
          filter: GRADIENT_BLUR,
        }}
      >
        <g filter="url(#filter0_f_7_1009)">
          <path
            d="M982.367 261.066C814.77 99.1405 593.043 79.8921 415.707 263.441C238.37 446.989 273.041 774.678 455.964 771.18C623.562 933.105 518.181 741.512 695.518 557.964C872.854 374.415 1149.96 422.991 982.367 261.066Z"
            fill="#1F5975"
            fillOpacity="0.6"
          />
        </g>
        <defs>
          <filter
            id="filter0_f_7_1009"
            x="0.00012207"
            y="-166.663"
            width="1333.5"
            height="1298.11"
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
              stdDeviation="149.643"
              result="effect1_foregroundBlur_7_1009"
            />
          </filter>
        </defs>
      </svg>

      {/* Ellipse 2 - center */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1000px",
          height: "950px",
          borderRadius: "1000px",
          background: "rgba(152, 166, 184, 0.15)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* ellipse 3 - bottom right */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="1200"
        height="1100"
        viewBox="0 0 895 810"
        fill="none"
        className="absolute"
        style={{
          bottom: "-300px",
          right: "-200px",
          fill: "rgba(87, 194, 214, 0.11)",
          filter: GRADIENT_BLUR,
        }}
      >
        <g filter="url(#filter0_f_7_1011)">
          <path
            d="M524.312 547.394C291.767 608.448 234.593 867.63 375.567 867.63C516.54 867.63 1012.15 928.119 1012.15 745.821C1012.15 563.523 1092.67 223.267 951.693 223.267C810.719 223.267 608.112 383.385 524.312 547.394Z"
            fill="#57C2D6"
            fillOpacity="0.11"
          />
        </g>
        <defs>
          <filter
            id="filter0_f_7_1011"
            x="0.00012207"
            y="-76.0187"
            width="1334.33"
            height="1252.56"
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
              stdDeviation="149.643"
              result="effect1_foregroundBlur_7_1011"
            />
          </filter>
        </defs>
      </svg>

      {/* Ellipse 4 - top right */}
      <div
        className="absolute"
        style={{
          top: "15%",
          right: "-400px",
          width: "1100px",
          height: "500px",
          borderRadius: "1100px",
          background: "rgba(199, 240, 254, 0.12)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* Noise overlay to reduce banding */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-5"
      >
        <defs>
          <filter id="noise-dark">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noise-dark)" />
      </svg>
    </div>
  );
}

function LightGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
      {/* ellipse 1 - top left */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="1200"
        height="1100"
        viewBox="0 0 860 810"
        fill="none"
        className="absolute"
        style={{
          top: "-100px",
          left: "-300px",
          filter: GRADIENT_BLUR,
        }}
      >
        <g filter="url(#filter0_f_7_1190)">
          <path
            d="M982.367 261.066C814.77 99.1405 593.043 79.8921 415.707 263.441C238.37 446.989 273.041 774.678 455.964 771.18C623.562 933.105 518.181 741.512 695.518 557.964C872.854 374.415 1149.96 422.991 982.367 261.066Z"
            fill="#1F5975"
            fillOpacity="0.35"
          />
        </g>
        <defs>
          <filter
            id="filter0_f_7_1190"
            x="0"
            y="-166.663"
            width="1333.5"
            height="1298.11"
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
              stdDeviation="149.643"
              result="effect1_foregroundBlur_7_1190"
            />
          </filter>
        </defs>
      </svg>

      {/* ellipse 2 - center */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1000px",
          height: "950px",
          borderRadius: "1000px",
          background: "rgba(152, 166, 184, 0.25)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* ellipse 3 - top right */}
      <div
        className="absolute"
        style={{
          top: "15%",
          right: "-400px",
          width: "1100px",
          height: "500px",
          borderRadius: "1100px",
          background: "rgba(199, 240, 254, 0.12)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* Noise overlay to reduce banding */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-5"
      >
        <defs>
          <filter id="noise-light">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noise-light)" />
      </svg>
    </div>
  );
}

function GradientBackground() {
  const theme = useTheme();
  if (theme.theme === "dark") {
    return <DarkGradientBackground />;
  }
  return <LightGradientBackground />;
}

export function ShellLayout({
  children,
  companyName,
  productName,
  companyLogo,
}: PropsWithChildren<ShellLayoutProps>) {
  return (
    <div className="h-screen overflow-hidden flex bg-sidebar">
      <Sidebar
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <GradientBackground />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
