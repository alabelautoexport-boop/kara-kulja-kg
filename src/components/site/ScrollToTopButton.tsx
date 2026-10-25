import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ScrollToTopButton() {
  const { t } = useI18n();
  const href = useLocation({ select: (location) => location.href });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    const frame = window.requestAnimationFrame(updateVisibility);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [href]);

  if (!visible) return null;

  const label = t("common.backToTop");
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
      }}
      style={{
        bottom: "calc(var(--scroll-top-gap) + env(safe-area-inset-bottom, 0px))",
        right: "calc(var(--scroll-top-gap) + env(safe-area-inset-right, 0px))",
      }}
      className="fixed z-40 hidden h-11 w-11 items-center justify-center rounded-full border-0 bg-background/60 text-ember/70 backdrop-blur-md transition-colors duration-200 [--scroll-top-gap:1.25rem] hover:bg-background/80 hover:text-ember focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--beige)] motion-reduce:transition-none sm:[--scroll-top-gap:2rem] lg:flex"
    >
      <ArrowUp className="h-4 w-4" strokeWidth={1.25} aria-hidden="true" />
    </button>
  );
}
