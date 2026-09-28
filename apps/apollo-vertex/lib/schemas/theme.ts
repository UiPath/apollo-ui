import { z } from "zod";

const ThemeModeSchema = z.object({
  background: z.string().optional(),
  foreground: z.string().optional(),
  card: z.string().optional(),
  cardForeground: z.string().optional(),
  popover: z.string().optional(),
  popoverForeground: z.string().optional(),
  primary: z.string().optional(),
  primaryForeground: z.string().optional(),
  secondary: z.string().optional(),
  secondaryForeground: z.string().optional(),
  muted: z.string().optional(),
  mutedForeground: z.string().optional(),
  accent: z.string().optional(),
  accentForeground: z.string().optional(),
  destructive: z.string().optional(),
  success: z.string().optional(),
  info: z.string().optional(),
  warning: z.string().optional(),
  border: z.string().optional(),
  input: z.string().optional(),
  ring: z.string().optional(),
  chart1: z.string().optional(),
  chart2: z.string().optional(),
  chart3: z.string().optional(),
  chart4: z.string().optional(),
  chart5: z.string().optional(),
  sidebar: z.string().optional(),
  sidebarForeground: z.string().optional(),
  sidebarPrimary: z.string().optional(),
  sidebarPrimaryForeground: z.string().optional(),
  sidebarAccent: z.string().optional(),
  sidebarAccentForeground: z.string().optional(),
  sidebarBorder: z.string().optional(),
  sidebarRing: z.string().optional(),
});

export const ThemeConfigSchema = z.object({
  light: ThemeModeSchema.optional(),
  dark: ThemeModeSchema.optional(),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
