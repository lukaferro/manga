import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Manga & Anime
        </Link>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/browse" className={styles.link}>
          Browse
        </Link>
      </nav>
      <div className={styles.controls}>
        <ThemeToggle labels={{ light: "Light", dark: "Dark" }} />
      </div>
    </header>
  );
}
