import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gunluk Envanter ve Tuketim Takibi",
  description: "Gunluk tuketim kayitlarini kategori bazinda yonetin ve raporlayin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
