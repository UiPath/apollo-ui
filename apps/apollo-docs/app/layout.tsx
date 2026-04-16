import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import 'nextra-theme-docs/style.css';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: {
    default: 'Apollo UI Docs',
    template: '%s | Apollo UI Docs',
  },
  description: 'Central documentation for the Apollo UI design system — components, tokens, and guidelines across all stacks.',
};

const navbar = (
  <Navbar
    logo={<b style={{ fontWeight: 700, fontSize: '1.1rem' }}>Apollo UI</b>}
    align="left"
  >
    <a
      href="https://github.com/UiPath/apollo-ui"
      target="_blank"
      rel="noopener noreferrer"
      className="nav-link"
    >
      GitHub
    </a>
    <a
      href="https://apollo-design.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className="nav-link"
    >
      Storybook
    </a>
  </Navbar>
);

const footer = (
  <Footer>MIT {new Date().getFullYear()} — UiPath Apollo UI</Footer>
);

export default async function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <Layout
            sidebar={{ autoCollapse: false, defaultMenuCollapseLevel: 1 }}
            navbar={navbar}
            pageMap={await getPageMap()}
            docsRepositoryBase="https://github.com/UiPath/apollo-ui/tree/main/apps/apollo-docs"
            footer={footer}
          >
            {children}
          </Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
