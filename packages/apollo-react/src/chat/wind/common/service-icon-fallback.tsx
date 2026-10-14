/**
 * Stands in for an `icon` the Wind renderer cannot resolve to a lucide icon, so an unknown name
 * shows a neutral box instead of nothing.
 */
export function ServiceIconFallback({ icon }: { icon?: string }) {
  if (!icon) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      data-slot="service-icon-fallback"
      data-icon={icon}
      className="inline-block size-3.5 shrink-0 rounded-sm border border-dashed border-current opacity-50"
    />
  );
}

/** Holds an icon's space while its module loads, so menus do not shift. */
export function IconSlot() {
  return <span aria-hidden="true" className="inline-block size-4 shrink-0" />;
}
