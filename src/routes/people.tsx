import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import elderImg from "@/assets/elder.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import villageImg from "@/assets/village.jpg";
import valleyImg from "@/assets/valley.jpg";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "People of Kara-Kulja" },
      { name: "description", content: "Storytelling and portraits of the people of Kara-Kulja." },
      { property: "og:title", content: "People of Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "/people" }],
  }),
  component: PeoplePage,
});

const PEOPLE = [
  { name: "Эсенбек Аалы уулу", roleKey: "stories.role.shepherd", village: "Алай-Куу", img: elderImg, storyKey: "stories.story.esenbek" },
  { name: "Айжамал К.", roleKey: "stories.role.craftswoman", village: "Кара-Кулжа", img: horsemanImg, storyKey: "stories.story.aizhamal" },
  { name: "Бакыт А.", roleKey: "stories.role.guide", village: "Сары-Булак", img: villageImg, storyKey: "stories.story.bakyt" },
  { name: "Гүлзат Т.", roleKey: "stories.role.teacher", village: "Көк-Жар", img: valleyImg, storyKey: "stories.story.gulzat" },
];

function PeoplePage() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <PageHero eyebrow={t("stories.eyebrow")} title={t("stories.title")} image={elderImg} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <div className="space-y-20">
            {PEOPLE.map((p, i) => (
              <article key={p.name} className={`grid items-center gap-10 md:grid-cols-12 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="md:col-span-5">
                  <div className="relative aspect-[4/5] overflow-hidden border hairline">
                    <img src={p.img} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                </div>
                <div className="md:col-span-7">
                  <p className="kbd-eyebrow text-[var(--ember)]">{t(p.roleKey)} · {p.village}</p>
                  <h3 className="mt-4 font-display text-4xl text-balance md:text-5xl">{p.name}</h3>
                  <p className="mt-6 max-w-md text-pretty text-muted-foreground">{t(p.storyKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
