import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { NewsGalleryImage } from "@/lib/news-media";
import { useI18n } from "@/lib/i18n";

const labels = {
  kg: {
    title: "Сүрөт галереясы",
    previous: "Мурунку сүрөт",
    next: "Кийинки сүрөт",
    close: "Жабуу",
  },
  ru: {
    title: "Фотогалерея",
    previous: "Предыдущее изображение",
    next: "Следующее изображение",
    close: "Закрыть",
  },
  en: { title: "Photo gallery", previous: "Previous image", next: "Next image", close: "Close" },
};

export function NewsLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  returnFocus,
}: {
  images: NewsGalleryImage[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { lang } = useI18n();
  const copy = labels[lang];
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const image = index === null ? null : images[index];
  const move = (direction: number) => {
    if (index !== null && images.length > 1) {
      onIndexChange((index + direction + images.length) % images.length);
    }
  };
  const controlClass =
    "absolute z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white/90 hover:bg-black/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  return (
    <Dialog.Root open={Boolean(image)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              move(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <Dialog.Title className="sr-only">{copy.title}</Dialog.Title>
          {image && (
            <img
              src={image.url}
              alt=""
              draggable={false}
              className="max-h-[calc(100dvh-7rem)] max-w-[calc(100%-2rem)] touch-pan-y select-none object-contain sm:max-w-[calc(100%-9rem)]"
              onPointerDown={(event) => {
                if (event.pointerType === "mouse") return;
                start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                const origin = start.current;
                start.current = null;
                if (!origin || origin.id !== event.pointerId) return;
                const dx = event.clientX - origin.x;
                const dy = event.clientY - origin.y;
                if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
              }}
              onPointerCancel={() => {
                start.current = null;
              }}
            />
          )}
          {images.length > 1 && (
            <>
              <button
                type="button"
                className={`${controlClass} left-0 top-1/2 -translate-y-1/2 sm:left-3`}
                aria-label={copy.previous}
                title={copy.previous}
                onClick={() => move(-1)}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                className={`${controlClass} right-0 top-1/2 -translate-y-1/2 sm:right-3`}
                aria-label={copy.next}
                title={copy.next}
                onClick={() => move(1)}
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <Dialog.Close
            className={`${controlClass} right-2 top-2 sm:right-4 sm:top-4`}
            aria-label={copy.close}
            title={copy.close}
          >
            <X className="h-6 w-6" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
