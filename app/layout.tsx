import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getMessages } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import LangSwitcher from "@/components/LangSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manga & Anime",
  description: "Browse manga and anime powered by AniList",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const t = getMessages(lang);

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <nav className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              Manga & Anime
            </Link>
            <Link href="/" className="text-sm">
              {t.home}
            </Link>
            <Link href="/browse" className="text-sm">
              {t.browse}
            </Link>
          </nav>
          <LangSwitcher lang={lang} />
        </header>
        {children}
      </body>
    </html>
  );
}
