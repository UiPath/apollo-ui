"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TranslationKey } from "./TranslationKey";
import { Text } from "./text";

interface MinimalNavItemProps {
  to: string;
  label: TranslationKey;
  active?: boolean;
}

export const MinimalNavItem = ({ to, label, active }: MinimalNavItemProps) => {
  const pathname = usePathname();
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
