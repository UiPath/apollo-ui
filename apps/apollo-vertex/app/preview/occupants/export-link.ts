/*
 * The link Export shares. Where a public base URL is configured, say a
 * deployed workbench or a preview deployment, the link is built on it, so
 * a page composed locally opens there too; otherwise it's the page's own
 * address. A link on this computer only works here, so the dialog says so.
 */

/** The configured public base, e.g. "https://org.uipath.host/apollo-vertex". */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_APOLLO_VERTEX_SHARE_URL ?? "";
/** The sub-path this build is served from, if any, as Next's basePath. */
const BASE_PATH = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH ?? "";

/** The parts of an address the link takes: where it is, and its state. */
type Address = Pick<URL, "href" | "pathname" | "search" | "hash">;

/**
 * The page's link on the public base, keeping its path within the app and
 * its query and hash; the page's own address when there's no base.
 */
export function shareLink(
  address: Address,
  base = PUBLIC_BASE,
  basePath = BASE_PATH,
): string {
  if (!base) return address.href;
  const prefix = basePath ? `/${basePath.replaceAll(/^\/+|\/+$/g, "")}` : "";
  const path =
    prefix && address.pathname.startsWith(prefix)
      ? address.pathname.slice(prefix.length) || "/"
      : address.pathname;
  return `${base.replace(/\/+$/, "")}${path}${address.search}${address.hash}`;
}

/** Hosts that only this computer reaches. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/** A link only this computer can open. */
export function isLocalLink(link: string): boolean {
  try {
    const { hostname } = new URL(link);
    return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}
