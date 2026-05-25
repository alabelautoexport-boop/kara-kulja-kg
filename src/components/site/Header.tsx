import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";

const NAV = [
  { to: "/about", key: "nav.about" },
  { to: "/villages", key: "nav.villages" },
  { to: "/tourism", key: "nav.tourism" },
  { to: "/invest", key: "nav.invest" },
  { to: "/people", key: "nav.people" },
  { to: "/history", key: "nav.history" },
  { to: "/gallery", key: "nav.gallery" },
  { to: "/news", key: "nav.news" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "bg-background/85 backdrop-blur-xl border-b hairline"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="h-2 w-2 rounded-full bg-[var(--ember)]" />
          <span className="font-display text-xl tracking-tight text-foreground">Kara-Kulja</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.slice(0, 6).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 text-[11px] tracking-widest sm:flex">
            {(["kg", "ru", "en"] as Lang[]).map((l, i) => (
              <div key={l} className="flex items-center">
                {i > 0 && <span className="px-1.5 text-muted-foreground/40">|</span>}
                <button
                  onClick={() => setLang(l)}
                  className={`uppercase transition-colors ${
                    lang === l ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-sm p-2 text-foreground lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t hairline bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col px-6 py-6">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 font-display text-xl uppercase tracking-[0.06em] text-foreground"
              >
                {t(n.key)}
              </Link>
            ))}
            <div className="mt-6 flex items-center gap-1 text-xs tracking-widest sm:hidden">
              {(["kg", "ru", "en"] as Lang[]).map((l, i) => (
                <div key={l} className="flex items-center">
                  {i > 0 && <span className="px-2 text-muted-foreground/40">|</span>}
                  <button
                    onClick={() => setLang(l)}
                    className={`uppercase ${lang === l ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {l}
                  </button>
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
