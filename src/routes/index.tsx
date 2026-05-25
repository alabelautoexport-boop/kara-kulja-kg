import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown, Mountain, Sprout, Compass, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import heroImg from "@/assets/hero-mountains.jpg";
import villageImg from "@/assets/village.jpg";
import valleyImg from "@/assets/valley.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import elderImg from "@/assets/elder.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import agricultureImg from "@/assets/agriculture.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kara-Kulja District" },
      {
        name: "description",
        content:
          "Кара-Кулжа району — Кыргыз Республикасынын маданий, туристтик жана инвестициялык санариптик жүзү.",
      },
      { property: "og:title", content: "Kara-Kulja District" },
      { property: "og:description", content: "Cultural portal, tourism showcase and investment gateway of Kara-Kulja, Kyrgyzstan." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <Hero />
      <About />
      <Discover />
      <Tourism />
      <Villages />
      <Invest />
      <Stories />
      <GalleryPreview />
      <News />
      <ContactCTA />
    </SiteLayout>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative flex h-[100svh] min-h-[680px] items-end overflow-hidden">
      <img
        src={heroImg}
        alt="Aerial view of Kara-Kulja mountains"
        className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
        fetchPriority="high"
      />
      {/* Atmospheric fog layers — slow, low-opacity, cinematic */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-fog-slow opacity-40 mix-blend-screen"
        style={{
          background:
            "radial-gradient(60% 40% at 30% 70%, rgba(255,255,255,0.18), transparent 70%), radial-gradient(50% 35% at 70% 60%, rgba(255,240,220,0.12), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-fog-slower opacity-30 mix-blend-screen"
        style={{
          background:
            "radial-gradient(45% 30% at 60% 80%, rgba(255,255,255,0.14), transparent 70%), radial-gradient(40% 25% at 20% 50%, rgba(220,230,255,0.10), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 animate-atmos-breathe bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background" />
      <div className="absolute inset-0 gradient-vignette" />


      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-20 lg:px-10 lg:pb-28">
        <p className="kbd-eyebrow text-[var(--beige)]/90 opacity-0 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {t("hero.eyebrow")}
        </p>
        <h1
          className="mt-6 font-display text-[clamp(3.5rem,12vw,11rem)] leading-[0.9] tracking-[-0.04em] text-foreground opacity-0 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          {t("hero.title")}
        </h1>
        <div className="mt-10 max-w-2xl opacity-0 animate-fade-up" style={{ animationDelay: "0.55s" }}>
          <p className="font-display text-xl font-light italic leading-[1.45] tracking-[0.005em] text-pretty text-foreground/85 md:text-[1.5rem]">
            «{t("hero.subtitle").split("\n").map((line, i, arr) => (
              <span key={i} className={i === 1 ? "whitespace-nowrap" : undefined}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}»
          </p>
        </div>

        <div
          className="mt-12 flex flex-wrap gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.8s" }}
        >
          <HeroBtn to="/about" primary>{t("hero.cta1")}</HeroBtn>
          <HeroBtn to="/tourism">{t("hero.cta2")}</HeroBtn>
          <HeroBtn to="/invest">{t("hero.cta3")}</HeroBtn>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-foreground/70 animate-scroll-hint">
        <span className="kbd-eyebrow text-[10px]">{t("hero.scroll")}</span>
        <ArrowDown className="h-4 w-4" />
      </div>
    </section>
  );
}

function HeroBtn({ to, children, primary }: { to: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-sm border px-6 py-3.5 text-sm font-medium tracking-wide transition-all ${
        primary
          ? "border-[var(--beige)] bg-[var(--beige)] text-primary-foreground hover:bg-foreground hover:text-background"
          : "border-foreground/30 bg-background/10 text-foreground backdrop-blur-md hover:border-foreground hover:bg-background/30"
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/* ---------- About ---------- */
function About() {
  const { t } = useI18n();
  const stats = [
    { v: "12", l: t("about.stat1") },
    { v: "103 200", l: t("about.stat2") },
    { v: "49", l: t("about.stat3") },
    { v: "4 327", l: t("about.stat4") },
  ];
  return (
    <section className="border-t hairline py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-12 lg:gap-24 lg:px-10">
        <div className="lg:col-span-5">
          <p className="kbd-eyebrow text-[var(--ember)]">{t("about.eyebrow")}</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-6xl">
            {t("about.title")}
          </h2>
        </div>
        <div className="lg:col-span-7">
          <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            {t("about.body")}
          </p>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden border hairline md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-background p-6">
                <div className="font-display text-3xl text-foreground md:text-4xl">{s.v}</div>
                <div className="mt-2 text-xs leading-snug text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Discover ---------- */
function Discover() {
  const { t } = useI18n();
  const items = [
    { icon: Mountain, label: t("discover.nature"), to: "/tourism", img: valleyImg },
    { icon: Compass, label: t("discover.tourism"), to: "/tourism", img: waterfallImg },
    { icon: Sprout, label: t("discover.invest"), to: "/invest", img: agricultureImg },
    { icon: Users, label: t("discover.people"), to: "/people", img: elderImg },
  ];
  return (
    <section className="border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="kbd-eyebrow text-[var(--ember)]">{t("discover.eyebrow")}</p>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">{t("discover.title")}</h2>
          </div>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, to, img }) => (
            <Link
              key={label}
              to={to}
              className="group relative block aspect-[3/4] overflow-hidden border hairline"
            >
              <img
                src={img}
                alt={label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <Icon className="h-5 w-5 text-[var(--beige)]" />
                <div className="mt-3 font-display text-2xl text-foreground">{label}</div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {t("discover.explore")} <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------- Tourism feature ---------- */
function Tourism() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden border-t hairline py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <div className="relative lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-[5/6]">
            <img
              src={horsemanImg}
              alt="Horseman in Kara-Kulja"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="kbd-eyebrow text-[var(--ember)]">{t("tourism.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-balance md:text-5xl">
            {t("tourism.title")}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {t("tourism.desc")}
          </p>
          <ul className="mt-10 divide-y hairline border-y hairline text-sm">
            {[
              t("tourism.item.mountains"),
              t("tourism.item.rivers"),
              t("tourism.item.horse"),
              t("tourism.item.hiking"),
              t("tourism.item.eco"),
            ].map((x) => (
              <li key={x} className="flex items-center justify-between py-4 text-foreground/90">
                <span>{x}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </li>
            ))}
          </ul>

          <Link
            to="/tourism"
            className="mt-10 inline-flex w-fit items-center gap-2 border-b hairline pb-1 text-sm font-medium text-foreground transition-colors hover:text-[var(--ember)]"
          >
            {t("tourism.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Villages ---------- */
function Villages() {
  const { t } = useI18n();
  const villages = [
    { name: "Кара-Кулжа", desc: t("village.tagline.kara-kulja"), img: villageImg },
    { name: "Алай-Куу", desc: t("village.tagline.alai-kuu"), img: valleyImg },
    { name: "Сары-Булак", desc: t("village.tagline.sary-bulak"), img: waterfallImg },
  ];

  return (
    <section className="border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kbd-eyebrow text-[var(--ember)]">{t("villages.eyebrow")}</p>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">
              {t("villages.title")}
            </h2>
          </div>
          <Link
            to="/villages"
            className="inline-flex items-center gap-2 border-b hairline pb-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("villages.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {villages.map((v, i) => (
            <Link
              key={v.name}
              to="/villages"
              className="group block border hairline"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={v.img}
                  alt={v.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 bg-background/70 px-2 py-1 text-[10px] tracking-widest text-foreground backdrop-blur-md">
                  0{i + 1}
                </div>
              </div>
              <div className="flex items-end justify-between gap-3 p-6">
                <div>
                  <div className="font-display text-2xl">{v.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Invest ---------- */
function Invest() {
  const { t } = useI18n();
  const opps = [
    { n: "01", label: t("invest.opp.agri") },
    { n: "02", label: t("invest.opp.livestock") },
    { n: "03", label: t("invest.opp.tourism") },
    { n: "04", label: t("invest.opp.energy") },
    { n: "05", label: t("invest.opp.infra") },
    { n: "06", label: t("invest.opp.business") },
  ];

  return (
    <section className="relative overflow-hidden border-t hairline">
      <img
        src={agricultureImg}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-background/85" />
      <div className="relative mx-auto grid max-w-[1400px] gap-16 px-6 py-24 lg:grid-cols-12 lg:gap-24 lg:px-10 lg:py-36">
        <div className="lg:col-span-5">
          <p className="kbd-eyebrow text-[var(--ember)]">{t("invest.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-balance md:text-6xl">
            {t("invest.title")}
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">{t("invest.desc")}</p>
          <Link
            to="/invest"
            className="mt-10 inline-flex items-center gap-2 bg-[var(--beige)] px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground"
          >
            {t("invest.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-px border hairline md:grid-cols-3">
            {opps.map((o) => (
              <div
                key={o.n}
                className="group relative aspect-square cursor-pointer bg-background/80 p-6 transition-colors hover:bg-[var(--accent)]/20"
              >
                <div className="kbd-eyebrow text-muted-foreground">{o.n}</div>
                <div className="absolute bottom-6 left-6 right-6 font-display text-xl md:text-2xl">
                  {o.label}
                </div>
                <ArrowRight className="absolute right-6 top-6 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stories / People ---------- */
function Stories() {
  const { t } = useI18n();
  const people = [
    { name: "Эсенбек Аалы уулу", role: t("stories.role.shepherd"), village: "Алай-Куу", img: elderImg },
    { name: "Айжамал К.", role: t("stories.role.craftswoman"), village: "Кара-Кулжа", img: horsemanImg },
    { name: "Бакыт А.", role: t("stories.role.guide"), village: "Сары-Булак", img: villageImg },
  ];

  return (
    <section className="border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <p className="kbd-eyebrow text-[var(--ember)]">{t("stories.eyebrow")}</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl text-balance md:text-5xl">
          {t("stories.title")}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {people.map((p) => (
            <article key={p.name} className="group">
              <div className="relative aspect-[4/5] overflow-hidden border hairline">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                />
              </div>
              <div className="mt-5">
                <div className="font-display text-xl">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.role} · {p.village}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Gallery preview ---------- */
function GalleryPreview() {
  const { t } = useI18n();
  const imgs = [valleyImg, villageImg, horsemanImg, waterfallImg, agricultureImg, elderImg];
  return (
    <section className="border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl text-balance md:text-5xl">{t("gallery.title")}</h2>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 border-b hairline pb-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("gallery.viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          {imgs.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${i % 5 === 0 ? "row-span-2 aspect-[3/5]" : "aspect-[4/5]"}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------- News ---------- */
function News() {
  const { t } = useI18n();
  const news = [
    { date: "12 May 2026", title: t("news.item.1") },
    { date: "04 May 2026", title: t("news.item.2") },
    { date: "21 Apr 2026", title: t("news.item.3") },
  ];
  return (
    <section className="border-t hairline py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="kbd-eyebrow text-[var(--ember)]">{t("news.eyebrow")}</p>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">{t("news.title")}</h2>
          </div>
          <Link to="/news" className="text-sm text-muted-foreground hover:text-foreground">
            {t("news.all")} →
          </Link>
        </div>

        <ul className="mt-12 divide-y hairline border-y hairline">
          {news.map((n) => (
            <li key={n.title}>
              <Link to="/news" className="group grid grid-cols-12 items-center gap-6 py-6">
                <span className="col-span-4 text-xs tracking-widest text-muted-foreground md:col-span-2">
                  {n.date}
                </span>
                <span className="col-span-7 font-display text-lg text-foreground transition-colors group-hover:text-[var(--beige)] md:col-span-9 md:text-2xl">
                  {n.title}
                </span>
                <ArrowRight className="col-span-1 h-4 w-4 justify-self-end text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Contact CTA ---------- */
function ContactCTA() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden border-t hairline">
      <img src={heroImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative mx-auto max-w-[1400px] px-6 py-28 text-center lg:px-10 lg:py-40">
        <p className="kbd-eyebrow text-[var(--ember)]">{t("contact.eyebrow")}</p>
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-tight text-balance md:text-7xl">
          {t("contact.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">{t("contact.desc")}</p>
        <Link
          to="/contact"
          className="mt-10 inline-flex items-center gap-2 bg-[var(--beige)] px-7 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground"
        >
          {t("contact.send")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
