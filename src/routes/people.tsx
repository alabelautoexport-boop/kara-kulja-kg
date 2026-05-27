import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { PEOPLE, pick } from "@/lib/people-data";
import { getPageHeroUrl } from "@/lib/r2";

const peopleHeroImg = getPageHeroUrl("insandar");

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "People of Kara-Kulja" },
      { name: "description", content: "Storytelling and portraits of the people of Kara-Kulja." },
      { property: "og:title", content: "People of Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/people" }],
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const { t, lang } = useI18n();

  return (
    <SiteLayout>
      <PeopleHero eyebrow={t("people.eyebrow")} title={t("stories.title")} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <div className="space-y-20">
            {PEOPLE.map((p, i) => (
              <article key={pick(p.name, lang)} className={`grid items-center gap-10 md:grid-cols-12 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="md:col-span-5">
                  <div className="relative aspect-[4/5] overflow-hidden border hairline bg-background/70">
                    <img src={p.image} alt={pick(p.name, lang)} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                  </div>
                </div>
                <div className="md:col-span-7">
                  <p className="kbd-eyebrow text-[var(--ember)]">{pick(p.role, lang)}</p>
                  <h3 className="mt-4 font-display text-4xl text-balance md:text-5xl">{pick(p.name, lang)}</h3>
                  <p className="mt-6 max-w-xl text-pretty text-muted-foreground">{pick(p.body, lang)}</p>
                </div>
              </article>
            ))}
            {[0, 1].map((item) => (
              <article key={item} className={`grid items-center gap-10 md:grid-cols-12 ${item % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="md:col-span-5">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border hairline bg-background/70">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/40 to-transparent" />
                    <span className="relative text-xs tracking-[0.28em] text-muted-foreground/70">{t("common.soon")}</span>
                  </div>
                </div>
                <div className="md:col-span-7">
                  <p className="text-xs tracking-[0.28em] text-[var(--ember)]">{t("common.soon")}</p>
                  <div className="mt-4 h-px max-w-sm bg-border/70" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function PeopleHero({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section className="relative flex min-h-[60vh] items-end overflow-hidden pt-32">
      <img
        src={peopleHeroImg}
        alt=""
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
      />
      <div className="absolute inset-0 gradient-fade-b" />
      <div className="absolute inset-0 gradient-vignette" />
      <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
        <p className="kbd-eyebrow text-[var(--beige)]/80">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-balance text-foreground md:text-7xl">
          {title}
        </h1>
      </div>
    </section>
  );
}
