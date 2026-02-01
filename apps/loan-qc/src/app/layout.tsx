import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loan QC - Document Quality Control",
  description: "AI-assisted loan document quality control interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
