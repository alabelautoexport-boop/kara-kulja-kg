// Shared, dependency-free header checks. Used by browser preflight and Edge validation.
const ascii = (bytes: Uint8Array, start: number, count: number) =>
  String.fromCharCode(...bytes.subarray(start, start + count));
export function webpDimensions(bytes: Uint8Array, clean = true) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 20 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 4) !== "WEBP" ||
    view.getUint32(4, true) + 8 !== bytes.length
  )
    throw new Error("Invalid WebP");
  let dimensions: { width: number; height: number } | undefined;
  let image = false;
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error("Invalid WebP chunk");
    const kind = ascii(bytes, offset, 4),
      size = view.getUint32(offset + 4, true),
      p = offset + 8;
    if (
      p + size + (size % 2) > bytes.length ||
      (clean && !["VP8 ", "VP8L", "VP8X", "ALPH"].includes(kind))
    )
      throw new Error("Image metadata or invalid chunk");
    let next;
    if (kind === "VP8X" && size >= 10) {
      if (clean && bytes[p] & 0x0e) throw new Error("Animated/metadata image");
      const u24 = (n: number) => bytes[n] | (bytes[n + 1] << 8) | (bytes[n + 2] << 16);
      next = { width: u24(p + 4) + 1, height: u24(p + 7) + 1 };
    } else if (kind === "VP8 " && size >= 10 && ascii(bytes, p + 3, 3) === "\x9d\x01\x2a") {
      next = {
        width: view.getUint16(p + 6, true) & 0x3fff,
        height: view.getUint16(p + 8, true) & 0x3fff,
      };
      image = true;
    } else if (kind === "VP8L" && size >= 5 && bytes[p] === 0x2f) {
      const bits = view.getUint32(p + 1, true);
      next = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      image = true;
    }
    if (next) {
      if (dimensions && (dimensions.width !== next.width || dimensions.height !== next.height))
        throw new Error("Inconsistent image dimensions");
      dimensions = next;
    }
    offset = p + size + (size % 2);
  }
  if (!dimensions?.width || !dimensions.height || !image) throw new Error("Missing WebP image");
  return dimensions;
}

export function sourceImageDimensions(bytes: Uint8Array, mime: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (mime === "image/png") {
    if (bytes.length < 24 || ascii(bytes, 1, 3) !== "PNG" || ascii(bytes, 12, 4) !== "IHDR")
      throw new Error("Invalid PNG");
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (mime === "image/webp") return webpDimensions(bytes, false);
  if (mime === "image/jpeg" || mime === "image/jpg") {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Invalid JPEG");
    let p = 2;
    while (p + 4 < bytes.length) {
      if (bytes[p++] !== 0xff) break;
      while (bytes[p] === 0xff) p++;
      const marker = bytes[p++];
      if (marker === 0xda || marker === 0xd9) break;
      const size = view.getUint16(p);
      if (size < 2 || p + size > bytes.length) break;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      )
        return { width: view.getUint16(p + 5), height: view.getUint16(p + 3) };
      p += size;
    }
  }
  return null;
}
