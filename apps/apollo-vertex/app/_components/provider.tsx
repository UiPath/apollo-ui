"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { createInstance } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { VERTEX_NAMESPACE } from "@/lib/vertex-translation";
import en from "@/locales/en.json";

// Coded App preview builds serve the app from a sub-path, and fetch() does not
// apply the Next.js basePath, so the search index URL is prefixed here.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;

// Without an instance, vertex components render bare keys on docs pages.
const i18n = createInstance();
void i18n.init({
  lng: "en",
  ns: [VERTEX_NAMESPACE],
  defaultNS: VERTEX_NAMESPACE,
  resources: { en: { [VERTEX_NAMESPACE]: en } },
  interpolation: { escapeValue: false },
  initAsync: false,
});

export function Provider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  );
}
