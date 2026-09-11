// Coded App preview builds serve the app from a sub-path; Next.js basePath
// does not rewrite plain image sources (only next/image, next/link, and
// next/script get that treatment), so any `<img src="/foo.svg">` needs the
// prefix applied by hand. Plain deployments (this app's own Vercel preview)
// leave NEXT_PUBLIC_APOLLO_CODED_APP_PATH unset, so this resolves to "".
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;

export const ASSET_PREFIX = codedAppPath ? `/${codedAppPath}` : "";

/** Prefixes a root relative public asset path (e.g. "/UiPath.svg") for the
 * current deployment, a Coded App preview's own sub-path or nothing. */
export function assetPath(path: string): string {
  return `${ASSET_PREFIX}${path}`;
}
