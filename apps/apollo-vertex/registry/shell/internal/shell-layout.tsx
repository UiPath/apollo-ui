import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
  companyLogo: React.ReactElement;
}

export function ShellLayout({
  children,
  companyName,
  productName,
  companyLogo,
}: PropsWithChildren<ShellLayoutProps>) {
  return (
    <div className="h-screen p-3 overflow-hidden flex gap-2 bg-sidebar">
      <Sidebar
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
      />
      <main className="flex-1 flex flex-col overflow-hidden bg-background rounded-2xl border border-foreground/15">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
