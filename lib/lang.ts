import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const lang = store.get(LANG_COOKIE)?.value;
  return lang === "en" ? "en" : "it";
}
