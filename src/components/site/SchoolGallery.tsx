import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import { schoolPublicImageUrl, type SchoolMediaImage } from "@/lib/school-media-model";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
export function SchoolGallery({ images }: { images: SchoolMediaImage[] }) {
  const { lang } = useI18n();
  const [opened, setOpened] = useState<SchoolMediaImage | null>(null);
  const c = SCHOOL_COPY[lang];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {images
          .filter((image) => schoolPublicImageUrl(image, "thumb"))
          .map((image, index) => (
            <button
              type="button"
              key={image.asset_id}
              onClick={() => setOpened(image)}
              aria-label={`${c.schoolLife}: ${index + 1}`}
              className="min-w-0 border hairline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--beige)]"
            >
              <img
                src={schoolPublicImageUrl(image, "thumb")}
                alt={`${c.schoolLife}: ${index + 1}`}
                width={image.thumb_width}
                height={image.thumb_height}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
      </div>
      <Dialog
        open={!!opened}
        onOpenChange={(open) => {
          if (!open) setOpened(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="z-[1501] max-h-[90vh] max-w-[calc(100%-2rem)] overflow-auto sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{c.schoolLife}</DialogTitle>
          {opened && (
            <img
              src={schoolPublicImageUrl(opened, "main")}
              alt={c.schoolLife}
              width={opened.width}
              height={opened.height}
              className="max-h-[75vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
