import * as lucide from 'lucide-react';
import type React from 'react';

import { ServiceIconFallback } from './service-icon-fallback';

type IconComponent = React.ComponentType<lucide.LucideProps>;

// Exports that start upper-case but are not icons.
const NOT_ICONS = new Set(['Icon', 'createLucideIcon', 'icons']);

const toPascalCase = (kebab: string) =>
  kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const isComponent = (value: unknown) =>
  typeof value === 'function' ||
  (typeof value === 'object' && value !== null && '$$typeof' in value);

/**
 * Resolves a consumer `icon` to a lucide export: kebab-case (`message-circle-plus`) or the
 * PascalCase export name (`MessageCirclePlus`), including lucide's deprecated aliases
 * (`alert-circle`, `AlertCircle`). Digit runs follow lucide's own names, so `arrow-down-0-1` and
 * `ArrowDown01` are the same icon.
 */
export function resolveLucideIconName(icon: string): string | undefined {
  const name = icon.includes('-') || /^[a-z]/.test(icon) ? toPascalCase(icon) : icon;
  if (!/^[A-Z]/.test(name) || NOT_ICONS.has(name) || !Object.hasOwn(lucide, name)) {
    return undefined;
  }
  return isComponent((lucide as Record<string, unknown>)[name]) ? name : undefined;
}

/**
 * Loaded on demand by `ServiceIcon`: it reaches every lucide icon by name, which is too large for
 * the chat's initial chunk, so the set lives in this module's chunk.
 */
export default function LucideIcon({ icon }: { icon: string }) {
  const name = resolveLucideIconName(icon);

  if (!name) {
    return <ServiceIconFallback icon={icon} />;
  }

  const Icon = (lucide as unknown as Record<string, IconComponent>)[name]!;
  return <Icon aria-hidden="true" data-icon={icon} />;
}
