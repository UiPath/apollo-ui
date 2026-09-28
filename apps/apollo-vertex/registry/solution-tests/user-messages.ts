import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { z } from "zod";

export const UserMessageItemSchema = z.object({
  key: z.string(),
  category: z.enum(["Error", "Warning", "Info"]),
  details: z.record(z.string(), z.string()),
  timestamp: z.string(),
  message: z.string(),
});

export type UserMessageItem = z.infer<typeof UserMessageItemSchema>;

export function parseUserMessages(messages: unknown): UserMessageItem[] {
  let value: unknown = messages;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const items: UserMessageItem[] = [];
  for (const entry of value) {
    const result = UserMessageItemSchema.safeParse(entry);
    if (result.success) items.push(result.data);
  }
  return items;
}

const SEVERITY_ORDER: Record<UserMessageItem["category"], number> = {
  Error: 2,
  Warning: 1,
  Info: 0,
};

export function worstSeverity(
  messages: UserMessageItem[],
): UserMessageItem["category"] | null {
  if (messages.length === 0) return null;
  let worst: UserMessageItem["category"] = messages[0].category;
  for (const msg of messages) {
    if (SEVERITY_ORDER[msg.category] > SEVERITY_ORDER[worst]) {
      worst = msg.category;
    }
  }
  return worst;
}

export const severityIcons = {
  Error: AlertCircle,
  Warning: AlertTriangle,
  Info: Info,
} as const;

export const severityColors = {
  Error: "text-destructive",
  Warning: "text-warning",
  Info: "text-info",
} as const;

export const categoryBorderStyles = {
  Error:
    "border-l-destructive bg-destructive/10 dark:bg-destructive/25 text-foreground",
  Warning: "border-l-warning bg-warning/15 dark:bg-warning/25 text-foreground",
  Info: "border-l-info bg-info/15 dark:bg-info/25 text-foreground",
} as const;
