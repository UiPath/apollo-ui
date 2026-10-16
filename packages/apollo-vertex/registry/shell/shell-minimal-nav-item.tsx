import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { navPathIsActive } from "./shell-nav-active";
import { Text } from "./shell-text";
import type { ShellNavLabel } from "./shell-translation-key";

interface MinimalNavItemProps {
  to: string;
  path: string;
  label: ShellNavLabel;
}

export const MinimalNavItem = ({ to, path, label }: MinimalNavItemProps) => {
  const { pathname } = useLocation();
  const isActive = navPathIsActive(pathname, path);

  return (
    <Link
      to={to}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0 whitespace-nowrap",
        isActive
          ? "bg-[oklch(0.92_0.035_218)] dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
      )}
    >
      <Text value={label} />
    </Link>
  );
};
