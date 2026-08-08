import { THEME_COOKIE } from "@/lib/theme";

export default function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var t=m?decodeURIComponent(m[1]):"";var r=t==="dark"?"dark":t==="light"?"light":window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",r)}catch(e){}})()`,
      }}
    />
  );
}
