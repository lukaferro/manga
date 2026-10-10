"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import styles from "./Navbar.module.css";

const FADE_RANGE = 240;

const NAV_LINKS = [
  { href: "/", label: "Home", hideOnMobile: true },
  { href: "/browse", label: "Browse" },
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
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          Manga&nbsp;&amp;&nbsp;Anime
        </Link>
        <div className={styles.links}>
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${active ? styles.linkActive : ""} ${
                  link.hideOnMobile ? styles.hideOnMobile : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className={styles.controls}>
        <ThemeToggle labels={{ light: "Light", dark: "Dark" }} />
        <UserMenu />
      </div>
    </header>
  );
}
