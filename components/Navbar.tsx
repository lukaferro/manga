import Link from "next/link";
import LangSwitcher from "@/components/LangSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { getMessages } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import styles from "./Navbar.module.css";

export default async function Navbar() {
  const lang = await getLang();
  const t = getMessages(lang);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Manga & Anime
        </Link>
        <Link href="/" className={styles.link}>
          {t.home}
        </Link>
        <Link href="/browse" className={styles.link}>
          {t.browse}
        </Link>
      </nav>
      <div className={styles.controls}>
        <LangSwitcher lang={lang} />
        <ThemeToggle labels={{ light: t.light, dark: t.dark }} />
      </div>
    </header>
  );
}
