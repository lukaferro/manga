"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./Navbar.module.css";

const FADE_RANGE = 240;

export default function Navbar() {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const progress = isHome ? Math.min(1, scrollY / FADE_RANGE) : 1;
  const solid = progress > 0.5;

  return (
    <header className={`${styles.header} ${solid ? styles.solid : ""}`}>
      <div className={styles.bg} style={{ opacity: progress }} aria-hidden="true" />
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Manga&nbsp;&amp;&nbsp;Anime
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
