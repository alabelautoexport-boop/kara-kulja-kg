import { sourceImageDimensions, webpDimensions } from "./school-image-format";
export type SchoolImageKind = "cover" | "gallery";
export const SCHOOL_SOURCE_LIMIT = 20 * 1024 * 1024;
export const SCHOOL_IMAGE_PROFILES = {
  cover: {
    main: { side: 1600, target: 300 * 1024, max: 400 * 1024 },
    thumb: { side: 960, target: 130 * 1024, max: 150 * 1024 },
  },
  gallery: {
    main: { side: 1600, target: 220 * 1024, max: 300 * 1024 },
    thumb: { side: 480, target: 50 * 1024, max: 70 * 1024 },
  },
} as const;
export function checkSchoolSourceDimensions(width: number, height: number) {
  if (width < 1 || height < 1 || Math.max(width, height) > 8192 || width * height > 24_000_000)
    throw new Error("Фотография слишком большая: выберите снимок до 24 Мп и 8192 px.");
}
export type ImageEncoder = {
  width: number;
  height: number;
  encode: (width: number, height: number, quality: number) => Promise<Blob>;
  close: () => void;
};
async function browserDecoder(file: File): Promise<ImageEncoder> {
  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const fallback = new Image();
      fallback.src = url;
      await fallback.decode();
      image = fallback;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  return {
    width,
    height,
    close: () => {
      if ("close" in image) image.close();
    },
    encode: async (w, h, quality) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) throw new Error("Оптимизация изображений недоступна в этом браузере.");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, w, h);
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob?.type === "image/webp"
              ? resolve(blob)
              : reject(new Error("Браузер не поддерживает подготовку WebP.")),
          "image/webp",
          quality,
        ),
      );
    },
  };
}
export async function optimizeSchoolImage(
  file: File,
  kind: SchoolImageKind,
  decode = browserDecoder,
) {
  if (
    !["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"].includes(
      file.type.toLowerCase(),
    )
  )
    throw new Error(
      "Выберите JPEG, PNG, WebP или поддерживаемый AVIF. HEIC и SVG не поддерживаются.",
    );
  if (!file.size || file.size > SCHOOL_SOURCE_LIMIT)
    throw new Error("Размер исходной фотографии не должен превышать 20 МиБ.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let header;
  try {
    header = sourceImageDimensions(bytes, file.type.toLowerCase());
  } catch {
    throw new Error("Не удалось прочитать фотографию. Выберите JPEG или PNG.");
  }
  if (header) checkSchoolSourceDimensions(header.width, header.height);
  let image: ImageEncoder | undefined;
  try {
    try {
      image = await decode(file);
    } catch {
      throw new Error("Не удалось прочитать фотографию. Выберите JPEG или PNG.");
    }
    checkSchoolSourceDimensions(image.width, image.height);
    const encode = async (profile: { side: number; target: number; max: number }) => {
      let last: { blob: Blob; width: number; height: number } | undefined;
      for (const factor of [1, 0.9, 0.8]) {
        const scale = Math.min(1, profile.side / Math.max(image!.width, image!.height)) * factor;
        const width = Math.max(1, Math.round(image!.width * scale)),
          height = Math.max(1, Math.round(image!.height * scale));
        for (const quality of [0.86, 0.82, 0.78]) {
          const blob = await image!.encode(width, height, quality);
          if (blob.type !== "image/webp")
            throw new Error("Браузер не поддерживает подготовку WebP.");
          const actual = webpDimensions(new Uint8Array(await blob.arrayBuffer()));
          if (actual.width !== width || actual.height !== height)
            throw new Error("Не удалось проверить подготовленное изображение.");
          if (blob.size <= profile.max) {
            last = { blob, width, height };
            if (blob.size <= profile.target) return last;
          }
        }
        if (last) return last;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      throw new Error(
        "Не удалось сохранить качество в пределах размера. Выберите другую фотографию.",
      );
    };
    const profile = SCHOOL_IMAGE_PROFILES[kind],
      id = crypto.randomUUID();
    const main = await encode(profile.main),
      thumb = await encode(profile.thumb);
    return {
      main: new File([main.blob], `${id}-main.webp`, { type: "image/webp" }),
      thumb: new File([thumb.blob], `${id}-thumb.webp`, { type: "image/webp" }),
      width: main.width,
      height: main.height,
      thumbWidth: thumb.width,
      thumbHeight: thumb.height,
    };
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Не удалось подготовить фотографию. Выберите JPEG или PNG.",
    );
  } finally {
    image?.close();
  }
}
