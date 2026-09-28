import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MTG Trader",
  description: "Trade cards with your squad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-amber-400 hover:text-amber-300 transition-colors">
              MTG Trader
            </Link>
            <Link
              href="/upload"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Upload Cards
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">{children}</main>
      </body>
    </html>
  );
}
