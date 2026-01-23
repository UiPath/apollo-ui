import type { PropsWithChildren } from "react";
import type { CompanyLogo } from "../shell";
import { Sidebar } from "./sidebar";

interface ShellLayoutProps {
  companyName: string;
  productName: string;
  companyLogo?: CompanyLogo;
}

export function ShellLayout({
  children,
  companyName,
  productName,
  companyLogo,
}: PropsWithChildren<ShellLayoutProps>) {
  return (
    <div className="h-screen overflow-hidden flex bg-sidebar">
      <Sidebar
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
