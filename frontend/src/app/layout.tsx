import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect — Your Health. Our Priority.",
  description:
    "A connector that turns a patient's prescription and insurance policy into a verified treatment quote from listed hospitals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
