"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import QuickSearch from "@/components/QuickSearch";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import styles from "./Navbar.module.css";

const FADE_RANGE = 240;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/schedule", label: "Schedule" },
  { href: "/my-list", label: "My List" },
];

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
      <Link href="/" className={styles.brand}>
        Manga&nbsp;&amp;&nbsp;Anime
      </Link>
      <nav className={styles.nav} aria-label="Main">
        <div className={styles.links}>
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${active ? styles.linkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className={styles.controls}>
        <QuickSearch />
        <ThemeToggle labels={{ light: "Light", dark: "Dark" }} />
        <UserMenu />
      </div>
    </header>
  );
}
