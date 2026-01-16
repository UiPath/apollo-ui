import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import type { ReactNode } from "react";
import Image from "next/image";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeWrapper } from "./components/theme-wrapper";
import { ThemeSwitcher } from "./components/theme-switcher";

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

const navbar = (
    <Navbar
        logo={
            <>
                <Image
                    src="/vertex-logo.svg"
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
            // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
            suppressHydrationWarning
        >
            <Head>
                {/* Your additional tags should be passed as `children` of `<Head>` element */}
            </Head>
            <body>
                <Analytics />
                <ThemeWrapper>
                    <Layout
                        sidebar={{ autoCollapse: false, defaultMenuCollapseLevel: 1 }}
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
