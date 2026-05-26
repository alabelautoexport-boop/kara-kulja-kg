import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kara-Kulja" },
      { name: "description", content: "Get in touch with Kara-Kulja district." },
      { property: "og:title", content: "Contact — Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  return (
    <SiteLayout>
      <section className="pt-40 pb-20 lg:pt-48 lg:pb-28">
        <div className="mx-auto grid max-w-[1300px] gap-16 px-6 lg:grid-cols-12 lg:gap-24 lg:px-10">
          <div className="lg:col-span-5">
            <p className="kbd-eyebrow text-[var(--ember)]">{t("contact.eyebrow")}</p>
            <h1 className="mt-5 font-display text-5xl text-balance md:text-6xl">{t("contact.title")}</h1>
            <p className="mt-6 max-w-md text-muted-foreground">{t("contact.desc")}</p>

            <div className="mt-12 space-y-6">
              <a href="mailto:info@kara-kulja.kg" className="flex items-start gap-4 text-foreground hover:text-[var(--beige)]">
                <Mail className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="kbd-eyebrow text-muted-foreground">{t("contact.label.email")}</div>
                  <div className="mt-1">info@kara-kulja.kg</div>
                </div>
              </a>
              <a href="tel:+996554888484" className="flex items-start gap-4 text-foreground hover:text-[var(--beige)]">
                <MessageCircle className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="kbd-eyebrow text-muted-foreground">{t("contact.label.phone")}</div>
                  <div className="mt-1">+996 554 888484</div>
                  <div className="mt-1">+1 343 500 6677</div>
                </div>
              </a>
              <div className="flex items-start gap-4 text-foreground">
                <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="kbd-eyebrow text-muted-foreground">{t("contact.label.address")}</div>
                  <div className="mt-1">{t("contact.address.value")}</div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="space-y-6 lg:col-span-7"
          >
            <Field label={t("contact.name")} type="text" required />
            <Field label={t("contact.email")} type="email" required />
            <div>
              <label className="kbd-eyebrow text-muted-foreground">{t("contact.message")}</label>
              <textarea
                required
                rows={6}
                className="mt-3 w-full resize-none border-0 border-b hairline bg-transparent py-3 text-foreground outline-none transition-colors focus:border-[var(--beige)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-[var(--beige)] px-7 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground"
            >
              {t("contact.send")}
            </button>
            {sent && <p className="text-sm text-[var(--accent)]">{t("contact.thanks")}</p>}
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="kbd-eyebrow text-muted-foreground">{label}</label>
      <input
        {...rest}
        className="mt-3 w-full border-0 border-b hairline bg-transparent py-3 text-foreground outline-none transition-colors focus:border-[var(--beige)]"
      />
    </div>
  );
}
