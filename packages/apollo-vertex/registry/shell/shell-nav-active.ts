export function navPathIsActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

// A parent is the current page only while none of its children is.
// Collapsed mode uses the same rule: the parent keeps the prefix color,
// and the current pill stays with the child even while that row is hidden.
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

export function navItemState(
  pathname: string,
  item: { path: string; to?: string; childPaths?: readonly string[] },
): { href: string; prefixActive: boolean; current: boolean } {
  const childPaths = item.childPaths ?? [];
  return {
    href: item.to ?? item.path,
    prefixActive: navPathIsActive(pathname, item.path),
    current: navItemIsCurrent(pathname, item.path, childPaths),
  };
}
