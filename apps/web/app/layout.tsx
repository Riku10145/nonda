import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nonda",
  description: "薬の服用管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
