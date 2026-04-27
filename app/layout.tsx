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
    <html lang="tr" className="print:bg-white">
      <body className="min-h-screen bg-slate-950 text-slate-100 print:h-auto print:overflow-visible print:bg-white print:text-black">
        {children}
      </body>
    </html>
  );
}
