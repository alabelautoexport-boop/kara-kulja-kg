import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Download } from "lucide-react";
import agricultureImg from "@/assets/agriculture.jpg";

export const Route = createFileRoute("/invest")({
  head: () => ({
    meta: [
      { title: "Invest in Kara-Kulja" },
      { name: "description", content: "Investment opportunities in agriculture, livestock, tourism, energy and infrastructure." },
      { property: "og:title", content: "Invest in Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/invest" }],
  }),
  component: InvestPage,
});

function InvestPage() {
  const { t } = useI18n();
  const reasons = [
    { n: "01", k: t("invest.reason.location"), v: t("invest.reason.location.body") },
    { n: "02", k: t("invest.reason.resources"), v: t("invest.reason.resources.body") },
    { n: "03", k: t("invest.reason.workforce"), v: t("invest.reason.workforce.body") },
    { n: "04", k: t("invest.reason.gov"), v: t("invest.reason.gov.body") },
  ];
  const opps = [
    { t: t("invest.opp.agri"), d: t("invest.opp.agri.body") },
    { t: t("invest.opp.livestock"), d: t("invest.opp.livestock.body") },
    { t: t("invest.opp.tourismInv.title"), d: t("invest.opp.tourismInv.body") },
    { t: t("invest.opp.energy"), d: t("invest.opp.energy.body") },
    { t: t("invest.opp.infra"), d: t("invest.opp.infra.body") },
    { t: t("invest.opp.business"), d: t("invest.opp.business.body") },
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("invest.eyebrow")}
        title={t("invest.title")}
        subtitle={t("invest.desc")}
        image={agricultureImg}
      />

      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <p className="kbd-eyebrow text-[var(--ember)]">{t("invest.why.eyebrow")}</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl text-balance md:text-5xl">
            {t("invest.why.title")}
          </h2>
          <div className="mt-12 grid gap-px border hairline md:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div key={r.n} className="bg-background p-8">
                <div className="kbd-eyebrow text-muted-foreground">{r.n}</div>
                <div className="mt-6 font-display text-2xl">{r.k}</div>
                <div className="mt-3 text-sm text-muted-foreground">{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <h2 className="font-display text-4xl text-balance md:text-5xl">{t("invest.opps.heading")}</h2>
          <div className="mt-12 divide-y hairline border-y hairline">
            {opps.map((o, i) => (
              <div key={o.t} className="grid grid-cols-12 items-center gap-6 py-8">
                <span className="col-span-2 text-xs tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="col-span-10 font-display text-2xl md:col-span-4 md:text-3xl">{o.t}</h3>
                <p className="col-span-10 col-start-3 text-muted-foreground md:col-span-6 md:col-start-7">
                  {o.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border hairline p-8">
            <div>
              <div className="font-display text-2xl">{t("invest.brochure.title")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t("invest.brochure.desc")}</div>
            </div>
            <button className="inline-flex items-center gap-2 bg-[var(--beige)] px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-foreground">
              <Download className="h-4 w-4" /> {t("invest.brochure.cta")}
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3 text-sm">
            <a href="/contact" className="inline-flex items-center gap-2 border-b hairline pb-1 text-foreground">
              {t("invest.contactOffice")} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="tel:+996554888484" className="text-muted-foreground hover:text-foreground">+996 554 888484</a>
            <a href="tel:+13435006677" className="text-muted-foreground hover:text-foreground">+1 343 500 6677</a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
