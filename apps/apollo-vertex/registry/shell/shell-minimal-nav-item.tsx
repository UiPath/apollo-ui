"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Text } from "./shell-text";
import type { TranslationKey } from "./shell-translation-key";

interface MinimalNavItemProps {
  to: string;
  label: TranslationKey;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const MinimalNavItem = ({ to, label, active, onClick }: MinimalNavItemProps) => {
  const pathname = usePathname();
  const isActive = active ?? (pathname === to || pathname.startsWith(`${to}/`));

  return (
    <Link
      href={to}
      onClick={onClick}
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
