import { Analytics } from "@vercel/analytics/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { Inter } from "next/font/google";
import Image from "next/image";
import type { ReactNode } from "react";
import { source } from "../lib/source";
import { Provider } from "./_components/provider";
import { ThemeWrapper } from "./_components/theme-wrapper";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Apollo Vertex",
    template: "%s | Apollo Vertex",
  },
  description:
    "Design system for UiPath Vertical Solutions - customizable, industry-specific automation solutions built on the UiPath platform.",
  keywords: [
    "UiPath",
    "Apollo",
    "Vertex",
    "Design System",
    "Vertical Solutions",
    "Components",
    "React",
  ],
  authors: [{ name: "UiPath" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uipath.github.io/apollo-ui/",
    siteName: "Apollo Vertex",
    title: "Apollo Vertex",
    description: "Design system for UiPath Vertical Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apollo Vertex",
    description: "Design system for UiPath Vertical Solutions",
  },
};

// Coded App preview builds serve the app from a sub-path; Next.js basePath
// does not rewrite plain image sources, so the logo path is prefixed here.
const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontSans.variable}
      // Required by next-themes, which the Fumadocs root provider uses.
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <Analytics />
        <Provider>
          <ThemeWrapper>
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
          </ThemeWrapper>
        </Provider>
      </body>
    </html>
  );
}
