import { Link } from "@tanstack/react-router";
import { Mail, Phone, Globe } from "lucide-react";
import { KuljaMark } from "./KuljaMark";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative border-t hairline bg-background">
      {/* subtle atmospheric top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--beige)]/25 to-transparent"
      />
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <KuljaMark className="h-5 w-auto text-[var(--beige)]/80" />
              <span className="font-display text-2xl tracking-tight">Kara-Kulja</span>
            </div>
            <p className="mt-6 max-w-sm font-display text-xl font-light italic leading-[1.5] text-pretty text-muted-foreground/90">
              «{t("footer.slogan").split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}»
            </p>
            <p className="mt-8 kbd-eyebrow text-muted-foreground/70">{t("footer.tag")}</p>
          </div>

          <div className="md:col-span-4 md:col-start-7">
            <p className="kbd-eyebrow text-muted-foreground/70">{t("footer.nav")}</p>
            <ul className="mt-5 grid grid-cols-2 gap-y-2.5 text-sm">
              {[
                ["/about", "nav.about"],
                ["/territories", "nav.villages"],
                ["/tourism", "nav.tourism"],
                ["/invest", "nav.invest"],
                ["/people", "nav.people"],
                ["/history", "nav.history"],
                ["/gallery", "nav.gallery"],
                ["/contact", "nav.contact"],
              ].map(([to, k]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-1.5 text-muted-foreground transition-colors duration-300 hover:text-foreground"
                  >
                    <span className="h-px w-0 bg-[var(--beige)]/60 transition-all duration-500 group-hover:w-3" />
                    {t(k)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="kbd-eyebrow text-muted-foreground/70">{t("footer.contact")}</p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://kara-kulja.kg"
                  className="group inline-flex items-center gap-2.5 transition-colors duration-300 hover:text-foreground"
                >
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-[var(--beige)]" />
                  kara-kulja.kg
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@kara-kulja.kg"
                  className="group inline-flex items-center gap-2.5 transition-colors duration-300 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-[var(--beige)]" />
                  info@kara-kulja.kg
                </a>
              </li>
              <li>
                <a
                  href="tel:+996554888484"
                  className="group inline-flex items-center gap-2.5 transition-colors duration-300 hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-[var(--beige)]" />
                  +996 554 888 484
                </a>
              </li>
              <li>
                <a
                  href="tel:+13435006677"
                  className="group inline-flex items-center gap-2.5 transition-colors duration-300 hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-[var(--beige)]" />
                  +1 343 500 6677
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-3 border-t hairline pt-6 text-xs text-muted-foreground/70 md:flex-row">
          <span className="space-y-1">
            <span className="block">{t("footer.copyright")}</span>
            <span className="block">{t("footer.author")}</span>
          </span>
          <span className="tracking-wide">{t("footer.region")}</span>
        </div>
      </div>
    </footer>
  );
}
