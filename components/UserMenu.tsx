"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginHref, useSession } from "@/components/SessionProvider";
import styles from "./UserMenu.module.css";

export default function UserMenu() {
  const { user, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (status === "loading") {
    return <div className={styles.skeletonAvatar} />;
  }

  if (!user) {
    return (
      <a href={loginHref(pathname)} className={styles.loginBtn}>
        {/* AniList Minimal Logo */}
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
          className={styles.aniListLogo}
          aria-hidden="true"
        >
          <path d="M6.361 2.842 0 14.544h7.027l1.782-3.32h5.795L18.17 21.16H24L13.784 2.842H6.361zm2.348 4.385h2.646l2.128 3.972H8.71l-.001-3.972z" />
        </svg>
        <span className={styles.loginLabel}>Login with AniList</span>
      </a>
    );
  }

  const avatarUrl = user.avatar?.medium || user.avatar?.large || "";

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${user.name}`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={34}
            height={34}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.userHeader}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userBadge}>AniList Connected</span>
          </div>

          <div className={styles.menuLinks}>
            <Link
              href="/my-list"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span>My List</span>
            </Link>

            <Link
              href="/my-list/stats"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3v18h18M7 15v2M11 11v6M15 7v10M19 13v4" />
              </svg>
              <span>Stats</span>
            </Link>

            <a
              href={`https://anilist.co/user/${encodeURIComponent(user.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>View AniList Profile</span>
            </a>

            <a
              href={`/api/auth/logout?returnTo=${encodeURIComponent(pathname || "/")}`}
              role="menuitem"
              className={`${styles.menuItem} ${styles.logoutItem}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log out</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
