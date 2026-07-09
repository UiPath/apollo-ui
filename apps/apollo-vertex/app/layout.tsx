import { Inter } from "next/font/google";
import Image from "next/image";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SidebarHoverPrefetch } from "./_components/sidebar-hover-prefetch";
import { ThemeSwitcher } from "./_components/theme-switcher";
import { ThemeWrapper } from "./_components/theme-wrapper";

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

const navbar = (
  <Navbar
    logo={
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
    }
    // ... Your additional navbar options
  >
    <ThemeSwitcher />
  </Navbar>
);
const footer = (
  <Footer>MIT {new Date().getFullYear()} - UiPath Apollo Vertex</Footer>
);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontSans.variable}
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head>
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Analytics />
        <SidebarHoverPrefetch />
        <ThemeWrapper>
          <Layout
            sidebar={{
              autoCollapse: false,
              defaultMenuCollapseLevel: 1,
            }}
            navbar={navbar}
            pageMap={await getPageMap()}
            docsRepositoryBase="https://github.com/UiPath/apollo-ui/tree/main/apps/apollo-vertex"
            footer={footer}
          >
            {children}
          </Layout>
        </ThemeWrapper>
      </body>
    </html>
  );
}
