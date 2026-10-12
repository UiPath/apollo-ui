import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Provider } from "./_components/provider";
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

// Vercel Analytics only exists on the Vercel deployment, not in the static
// Coded App build.
const codedApp = process.env.NEXT_PUBLIC_APOLLO_CODED_APP === "1";

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
        {!codedApp && <Analytics />}
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
