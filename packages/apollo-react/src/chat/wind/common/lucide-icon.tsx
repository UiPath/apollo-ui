import { DynamicIcon, type IconName, iconNames } from 'lucide-react/dynamic';

import { IconSlot, ServiceIconFallback } from './service-icon-fallback';

let pascalToKebab: Map<string, IconName> | undefined;
const known = new Set<string>(iconNames);

/**
 * Resolves a consumer `icon` to a lucide name: kebab-case (`message-circle-plus`) or the
 * PascalCase export name (`MessageCirclePlus`).
 */
export function resolveLucideIconName(icon: string): IconName | undefined {
  if (known.has(icon)) {
    return icon as IconName;
  }

  // Built from the names so digit runs match lucide's own split ("ArrowDown01" is "arrow-down-0-1").
  pascalToKebab ??= new Map(
    iconNames.map((name) => [
      name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(''),
      name,
    ])
  );

  return pascalToKebab.get(icon);
}

/**
 * Loaded on demand by `ServiceIcon`: it carries lucide's name-to-module map, which is too large
 * for the chat's initial chunk.
 */
export default function LucideIcon({ icon }: { icon: string }) {
  const name = resolveLucideIconName(icon);

  if (!name) {
    return <ServiceIconFallback icon={icon} />;
  }

  return <DynamicIcon name={name} aria-hidden="true" data-icon={icon} fallback={IconSlot} />;
}
