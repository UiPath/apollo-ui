"use client";

import { Link } from "@radix-ui/react-navigation-menu";
import { cn } from "@/lib/utils";
import { Text } from "./shell-text";
import { TranslationKey } from "./shell-translation-key";

interface MinimalNavItemProps {
  to: string;
  label: TranslationKey;
  active?: boolean;
  pathname: string;
}

export const MinimalNavItem = ({
  to,
  label,
  active,
  pathname,
}: MinimalNavItemProps) => {
  const isActive = active ?? (pathname === to || pathname.startsWith(`${to}/`));

  return (
    <Link
      href={to}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 shrink-0 whitespace-nowrap",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Text value={label} />
    </Link>
  );
};
