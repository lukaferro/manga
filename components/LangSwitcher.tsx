"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/i18n";

export default function LangSwitcher({ lang }: { lang: Lang }) {
  const router = useRouter();

  function switchLang(next: Lang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <select
      value={lang}
      onChange={(e) => switchLang(e.target.value as Lang)}
      aria-label="Language"
    >
      <option value="it">IT</option>
      <option value="en">EN</option>
    </select>
  );
}
