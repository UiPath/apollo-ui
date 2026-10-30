export function navPathIsActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

// A parent is the current page only while none of its children is.
// The pill uses this even when the sidebar is collapsed.
export function navItemIsCurrent(
  pathname: string,
  path: string,
  childPaths: readonly string[] = [],
): boolean {
  return (
    navPathIsActive(pathname, path) &&
    !childPaths.some((childPath) => navPathIsActive(pathname, childPath))
  );
}

// Among prefix matches, the longest path wins. A detail route highlights its
// section without also selecting a shorter landing-page link.
export function mostSpecificActivePath(
  pathname: string,
  paths: readonly string[],
): string | null {
  let match: string | null = null;
  for (const path of paths) {
    if (!navPathIsActive(pathname, path)) continue;
    if (match === null || path.length > match.length) match = path;
  }
  return match;
}

export function navItemState(
  pathname: string,
  item: { path: string; to?: string; childPaths?: readonly string[] },
): { href: string; prefixActive: boolean; current: boolean } {
  const childPaths = item.childPaths ?? [];
  const childActive = childPaths.some((childPath) =>
    navPathIsActive(pathname, childPath),
  );
  return {
    href: item.to ?? item.path,
    prefixActive: navPathIsActive(pathname, item.path) || childActive,
    current: navItemIsCurrent(pathname, item.path, childPaths),
  };
}

// The sidebar keeps one item active: the one that owns the most specific match
// among item and child paths. A landing page such as `/<workspace>` prefixes
// every section under it and would otherwise stay active on all of them.
export function activeNavItemPath(
  pathname: string,
  items: readonly { path: string; childPaths?: readonly string[] }[],
): string | null {
  let owner: string | null = null;
  let matchLength = -1;
  for (const item of items) {
    for (const path of [item.path, ...(item.childPaths ?? [])]) {
      if (!navPathIsActive(pathname, path)) continue;
      if (path.length > matchLength) {
        owner = item.path;
        matchLength = path.length;
      }
    }
  }
  return owner;
}
