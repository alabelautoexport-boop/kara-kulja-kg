import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
}) {
  return (
    <section className="relative flex min-h-[60vh] items-end overflow-hidden pt-32">
      <img
        src={image}
        alt=""
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 gradient-fade-b" />
      <div className="absolute inset-0 gradient-vignette" />
      <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
        <p className="kbd-eyebrow text-[var(--beige)]/80">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-balance text-foreground md:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
