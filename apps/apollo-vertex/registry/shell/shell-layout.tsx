import type { PropsWithChildren, ReactNode } from "react";
import type { CompanyLogo, ShellNavItem } from "./shell";
import { Sidebar } from "./shell-sidebar";
import { useTheme } from "./shell-theme-provider";

const GRADIENT_BLUR = "blur(149.643px)";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
  navItems: ShellNavItem[];
  sidebarActions?: ReactNode;
  headerActions?: ReactNode;
  backgroundMode?: string;
}

function DarkGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base directional wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, transparent 60%)",
        }}
      />

      {/* Organic shape — upper left indigo (wide, stretched) */}
      <div
        className="absolute"
        style={{
          top: "-10%",
          left: "-15%",
          width: "70%",
          height: "35%",
          borderRadius: "30% 70% 65% 35% / 60% 30% 70% 40%",
          background: "rgba(99, 102, 241, 0.03)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* Organic shape — center purple (oblong, diagonal) */}
      <div
        className="absolute"
        style={{
          top: "25%",
          left: "20%",
          width: "65%",
          height: "30%",
          borderRadius: "25% 75% 60% 40% / 50% 35% 65% 50%",
          background: "rgba(122, 74, 198, 0.025)",
          filter: GRADIENT_BLUR,
          transform: "rotate(-8deg)",
        }}
      />

      {/* Organic shape — lower right cyan (stretched horizontal) */}
      <div
        className="absolute"
        style={{
          bottom: "-12%",
          right: "-10%",
          width: "60%",
          height: "28%",
          borderRadius: "65% 35% 30% 70% / 40% 60% 40% 60%",
          background: "rgba(34, 211, 238, 0.015)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* Grain texture */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-[0.04]"
      >
        <defs>
          <filter id="noise-dark">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base directional wash — soft sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(165, 180, 252, 0.05) 0%, rgba(196, 241, 249, 0.03) 100%)",
        }}
      />

      {/* Organic shape — upper left soft periwinkle (wide, stretched) */}
      <div
        className="absolute"
        style={{
          top: "-10%",
          left: "-15%",
          width: "70%",
          height: "35%",
          borderRadius: "30% 70% 65% 35% / 60% 30% 70% 40%",
          background: "rgba(165, 180, 252, 0.07)",
          filter: GRADIENT_BLUR,
        }}
      />

      {/* Organic shape — center lavender (oblong, diagonal) */}
      <div
        className="absolute"
        style={{
          top: "25%",
          left: "20%",
          width: "65%",
          height: "30%",
          borderRadius: "25% 75% 60% 40% / 50% 35% 65% 50%",
          background: "rgba(196, 167, 231, 0.06)",
          filter: GRADIENT_BLUR,
          transform: "rotate(-8deg)",
        }}
      />

      {/* Organic shape — lower right aqua (stretched horizontal) */}
      <div
        className="absolute"
        style={{
          bottom: "-12%",
          right: "-10%",
          width: "60%",
          height: "28%",
          borderRadius: "65% 35% 30% 70% / 40% 60% 40% 60%",
          background: "rgba(147, 230, 241, 0.05)",
          filter: GRADIENT_BLUR,
        }}
      />
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

function ExpressiveBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-300">
        <div
          className="absolute"
          style={{
            width: "60%",
            height: "70%",
            left: "35%",
            top: "20%",
            background: "rgba(78, 9, 77, 0.6)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "80%",
            height: "60%",
            left: "-5%",
            top: "-5%",
            background: "#223045",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "75%",
            height: "65%",
            left: "-10%",
            top: "0",
            background: "rgba(244, 66, 35, 0.27)",
            filter: "blur(90px)",
            transform: "rotate(23.94deg)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "85%",
            height: "45%",
            left: "30%",
            top: "-20%",
            background:
              "linear-gradient(257.56deg, rgba(152, 166, 184, 0.5) 36.7%, rgba(68, 74, 82, 0.5) 88.5%)",
            filter: "blur(100px)",
            transform: "rotate(-13.86deg)",
          }}
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(25, 13, 51, 0.79)",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}

export function ShellLayout({
  children,
  companyName,
  productName,
  variant,
  companyLogo,
  navItems,
  sidebarActions,
  headerActions,
  backgroundMode,
}: PropsWithChildren<ShellLayoutProps>) {
  if (variant === "minimal") {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background dark:bg-sidebar">
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <GradientBackground />
          <Sidebar
            companyName={companyName}
            variant={variant}
            productName={productName}
            companyLogo={companyLogo}
            navItems={navItems}
            sidebarActions={sidebarActions}
            headerActions={headerActions}
          />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden flex bg-background dark:bg-sidebar relative"
      style={{
        backgroundColor:
          backgroundMode === "expressive" ? "#190D33" : undefined,
      }}
    >
      {backgroundMode === "default" && <GradientBackground />}
      {backgroundMode === "expressive" && <ExpressiveBackground />}
      {!backgroundMode && <GradientBackground />}
      <Sidebar
        companyName={companyName}
        variant={variant}
        productName={productName}
        companyLogo={companyLogo}
        navItems={navItems}
        sidebarActions={sidebarActions}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
