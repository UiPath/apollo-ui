"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

// Coded App preview builds serve the app from a sub-path, and fetch() does not
// apply the Next.js basePath, so the search index URL is prefixed here.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        options: {
          // The index is exported as a static file and searched in the
          // browser, so search also works in the server-less Coded App build.
          type: "static",
          api: `${codedAppPath ? `/${codedAppPath}` : ""}/search.json`,
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
