import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
}

export function ShellLayout({
  children,
  companyName,
  productName,
}: PropsWithChildren<ShellLayoutProps>) {
  return (
    <div className="h-screen p-3 overflow-hidden flex gap-2 bg-sidebar">
      <Sidebar companyName={companyName} productName={productName} />
      <main className="flex-1 flex flex-col overflow-hidden bg-background rounded-2xl border border-foreground/15">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
