import React from 'react';

import { IconSlot } from './service-icon-fallback';

const LucideIcon = React.lazy(() => import('./lucide-icon'));

/**
 * An `icon` from a service-provided action, as a lucide name. Lucide's name map and each icon
 * load on first use; names it does not know (such as Material Icons names meant for the Material
 * renderer) show a neutral box.
 */
export function ServiceIcon({ icon }: { icon?: string }) {
  if (!icon) {
    return null;
  }

  return (
    <React.Suspense fallback={<IconSlot />}>
      <LucideIcon icon={icon} />
    </React.Suspense>
  );
}
