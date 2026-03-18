import { cn } from "@/lib/utils";
import { ShellLink, useShellPathname } from "./shell-router-context";
import { Text } from "./shell-text";
import type { TranslationKey } from "./shell-translation-key";

interface MinimalNavItemProps {
  to: string;
  label: TranslationKey;
}

export const MinimalNavItem = ({ to, label }: MinimalNavItemProps) => {
  const pathname = useShellPathname();
  const isActive = pathname === to;

  return (
    <ShellLink
      to={to}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0 whitespace-nowrap",
        isActive
          ? "bg-[oklch(0.92_0.035_218)] dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
      )}
    >
      <Text value={label} />
    </ShellLink>
  );
};
