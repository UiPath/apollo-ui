import { DocsLayout } from "fumadocs-ui/layouts/docs";
import Image from "next/image";
import type { ReactNode } from "react";
import { source } from "../../lib/source";

// Coded App preview builds serve the app from a sub-path; Next.js basePath
// does not rewrite plain image sources, so the logo path is prefixed here.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: (
          <>
            <Image
              src={`${codedAppPath ? `/${codedAppPath}` : ""}/vertex-logo.svg`}
              alt="Apollo Vertex"
              width={32}
              height={32}
              className="dark:invert"
            />
            <b>Apollo Vertex</b>
          </>
        ),
      }}
      githubUrl="https://github.com/UiPath/apollo-ui"
    >
      {children}
    </DocsLayout>
  );
}
