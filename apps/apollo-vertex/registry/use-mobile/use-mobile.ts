import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// Resolved lazily: the module is importable on the server, where there is no
// `window`, and only `subscribe`/`getSnapshot` ever run in the browser.
let mediaQuery: MediaQueryList | undefined;
function mobileQuery() {
  mediaQuery ??= window.matchMedia(MOBILE_QUERY);
  return mediaQuery;
}

function subscribe(onStoreChange: () => void) {
  const mql = mobileQuery();
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return mobileQuery().matches;
}

// A server render has no viewport, so it commits to desktop and the client
// corrects on hydration.
function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
