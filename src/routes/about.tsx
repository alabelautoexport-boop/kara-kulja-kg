import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import img from "@/assets/valley.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kara-Kulja" },
      { name: "description", content: "History, geography, nature and culture of Kara-Kulja district." },
      { property: "og:title", content: "About Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  const sections = [
    { k: t("about.section.history"), b: t("about.section.history.body") },
    { k: t("about.section.geography"), b: t("about.section.geography.body") },
    { k: t("about.section.nature"), b: t("about.section.nature.body") },
    { k: t("about.section.culture"), b: t("about.section.culture.body") },
    { k: t("about.section.overview"), b: t("about.section.overview.body") },
    { k: t("about.section.symbols"), b: t("about.section.symbols.body") },
  ];
  const aimaks = [
    "Алайкуу", "Капчыгай", "Кенеш", "Карагуз", "Кара-Кочкор", "Кара-Кулжа",
    "Кызыл-Жар", "Ылай-Талаа", "Ой-Тал", "Сары-Булак", "Чалма", "Кашка-Жол",
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        subtitle={t("about.body")}
        image={img}
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
              <li key={a} className="flex items-baseline gap-3 bg-background p-5">
                <span className="kbd-eyebrow text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-lg">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
