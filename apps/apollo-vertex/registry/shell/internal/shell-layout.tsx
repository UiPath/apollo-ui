import type { PropsWithChildren } from 'react';
import { Sidebar } from './sidebar';

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
    <div
      className="h-full w-full p-3 rounded-2xl overflow-hidden flex sidebar/primary-foreground gap-2"
      style={{ backgroundColor: '#001214' }}
    >
      <Sidebar companyName={companyName} productName={productName} />
      <main
        className="flex-1 flex flex-col"
        style={{
          borderRadius: '16px',
          background: '#121E2E',
        }}
      >
        {children}
      </main>
    </div>
  );
}
