import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { getPageHeroUrl } from "@/lib/r2";

const aboutHeroImg = getPageHeroUrl("about");

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kara-Kulja" },
      { name: "description", content: "History, geography, nature and culture of Kara-Kulja district." },
      { property: "og:title", content: "About Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  const sections = [
    { k: t("about.section.history"), b: t("about.section.history.body") },
    { k: t("about.section.geography"), b: t("about.section.geography.body") },
    { k: t("about.section.nature"), b: t("about.section.nature.body") },
    { k: t("about.section.culture"), b: t("about.section.culture.body") },
    { k: t("about.section.overview"), b: t("about.section.overview.body") },
    { k: t("about.section.symbols"), b: t("about.section.symbols.body") },
  ];
  const aimaks = [
    { name: { kg: "Кара-Кулжа", ru: "Кара-Кульджа", en: "Kara-Kulja" }, to: "/territories/kara-kulja" },
    { name: { kg: "Алайкуу", ru: "Алайкуу", en: "Alaikuu" }, to: "/territories/alaikuu" },
    { name: { kg: "Кара Гуз", ru: "Кара Гуз", en: "Kara-Guz" }, to: "/territories/kara-guz" },
    { name: { kg: "Кара-Кочкор", ru: "Кара-Кочкор", en: "Kara-Kochkor" }, to: "/territories/kara-kochkor" },
    { name: { kg: "Ой-Тал", ru: "Ой-Тал", en: "Oi-Tal" }, to: "/territories/oy-tal" },
    { name: { kg: "Рыспай Абдыкадыров", ru: "Рыспай Абдыкадыров", en: "Ryspai Abdykadyrov" }, to: "/territories/ryspai-abdykadyrov" },
    { name: { kg: "Ылай-Талаа", ru: "Ылай-Талаа", en: "Ylai-Talaa" }, to: "/territories/ylai-talaa" },
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        subtitle={t("about.body")}
        image={aboutHeroImg}
      />
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <div className="divide-y hairline border-y hairline">
            {sections.map((s) => (
              <div key={s.k} className="grid gap-6 py-10 md:grid-cols-12">
                <div className="md:col-span-4">
                  <p className="kbd-eyebrow text-[var(--ember)]">{s.k}</p>
                </div>
                <p className="text-pretty text-muted-foreground md:col-span-8">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <p className="kbd-eyebrow text-[var(--ember)]">{t("admin.eyebrow")}</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl text-balance md:text-5xl">{t("admin.title")}</h2>
          <p className="mt-6 max-w-2xl text-pretty text-muted-foreground">{t("admin.body")}</p>
          <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden border hairline sm:grid-cols-3 md:grid-cols-4">
            {aimaks.map((a, i) => (
              <li key={a.to} className="flex items-baseline gap-3 bg-background p-5">
                <span className="kbd-eyebrow text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <Link
                  to={a.to}
                  className="font-display text-lg transition-colors duration-300 hover:text-[var(--beige)]"
                >
                  {a.name[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
