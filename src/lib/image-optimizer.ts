const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const NEWS_IMAGE_SOURCE_LIMIT = 20 * 1024 * 1024;
export const NEWS_IMAGE_UPLOAD_LIMIT = 5 * 1024 * 1024;
export const NEWS_IMAGE_MAX_SIDE = 1920;
export const NEWS_IMAGE_PRESERVE_LIMIT = 1024 * 1024;
export const NEWS_IMAGE_WEBP_QUALITY = 0.9;

export interface OptimizedImageResult {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  originalWidth: number;
  originalHeight: number;
  optimizedWidth: number;
  optimizedHeight: number;
  wasOptimized: boolean;
}

type DecodedImage = ImageBitmap | HTMLImageElement;

function dimensions(image: DecodedImage) {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: image.width, height: image.height };
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // Fall through to the browser image decoder.
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function closeDecodedImage(image: DecodedImage) {
  if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
}

function outputName(originalName: string, extension: "png" | "webp") {
  const stem = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${stem}.${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось подготовить изображение."))),
      type,
      quality,
    );
  });
}

export function validateNewsImageSource(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error("Допустимы только JPG, PNG, WebP и AVIF.");
  }
  if (!file.size || file.size > NEWS_IMAGE_SOURCE_LIMIT) {
    throw new Error("Размер исходного изображения не должен превышать 20 МБ.");
  }
}

export async function optimizeNewsImage(file: File): Promise<OptimizedImageResult> {
  validateNewsImageSource(file);

  let image: DecodedImage | null = null;
  try {
    image = await decodeImage(file);
    const { width: originalWidth, height: originalHeight } = dimensions(image);
    if (!originalWidth || !originalHeight) throw new Error("Не удалось подготовить изображение.");

    const longestSide = Math.max(originalWidth, originalHeight);
    if (longestSide <= NEWS_IMAGE_MAX_SIDE && file.size <= NEWS_IMAGE_PRESERVE_LIMIT) {
      return {
        file,
        originalBytes: file.size,
        optimizedBytes: file.size,
        originalWidth,
        originalHeight,
        optimizedWidth: originalWidth,
        optimizedHeight: originalHeight,
        wasOptimized: false,
      };
    }

    const scale = Math.min(1, NEWS_IMAGE_MAX_SIDE / longestSide);
    const optimizedWidth = Math.max(1, Math.round(originalWidth * scale));
    const optimizedHeight = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = optimizedWidth;
    canvas.height = optimizedHeight;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Не удалось подготовить изображение.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, optimizedWidth, optimizedHeight);

    // Preserve PNG artwork and alpha instead of applying lossy photographic encoding.
    const preservePng = file.type.toLowerCase() === "image/png";
    const outputType = preservePng ? "image/png" : "image/webp";
    const extension = preservePng ? "png" : "webp";
    const blob = await canvasToBlob(
      canvas,
      outputType,
      preservePng ? undefined : NEWS_IMAGE_WEBP_QUALITY,
    );
    if (blob.type !== outputType) {
      throw new Error("Не удалось подготовить изображение: браузер не поддерживает формат.");
    }
    if (blob.size > NEWS_IMAGE_UPLOAD_LIMIT) {
      throw new Error("Не удалось подготовить изображение: итоговый файл превышает 5 МБ.");
    }

    const optimizedFile = new File([blob], outputName(file.name, extension), {
      type: outputType,
      lastModified: Date.now(),
    });
    return {
      file: optimizedFile,
      originalBytes: file.size,
      optimizedBytes: optimizedFile.size,
      originalWidth,
      originalHeight,
      optimizedWidth,
      optimizedHeight,
      wasOptimized: true,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Не удалось подготовить изображение")) {
      throw error;
    }
    throw new Error("Не удалось подготовить изображение.");
  } finally {
    if (image) closeDecodedImage(image);
  }
}

export function formatImageBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
