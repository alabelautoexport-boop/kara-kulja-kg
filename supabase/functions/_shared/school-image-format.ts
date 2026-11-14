// Server-only container/header validation. Never trusts MIME or browser optimization.
// No frontend imports or runtime dependencies are needed by the deployed function.
export function webpDimensions(bytes: Uint8Array) {
  const fail = (): never => {
    throw new Error("Invalid static WebP");
  };
  const text = (p: number, n: number) => String.fromCharCode(...bytes.subarray(p, p + n));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 26 ||
    bytes.length % 2 ||
    text(0, 4) !== "RIFF" ||
    text(8, 4) !== "WEBP" ||
    view.getUint32(4, true) + 8 !== bytes.length
  )
    fail();
  let canvas: { width: number; height: number } | undefined;
  let image: { width: number; height: number } | undefined;
  let alpha = false,
    hasAlpha = false;
  for (let offset = 12; offset < bytes.length; ) {
    if (offset + 8 > bytes.length) fail();
    const kind = text(offset, 4),
      size = view.getUint32(offset + 4, true),
      p = offset + 8;
    const end = p + size,
      padded = end + (size % 2);
    if (!size || padded > bytes.length || (size % 2 && bytes[end] !== 0)) fail();
    // Reject EXIF, XMP, ANIM/ANMF, ICC and unknown chunks, even without VP8X flags.
    if (!["VP8X", "VP8 ", "VP8L", "ALPH"].includes(kind)) fail();
    if (kind === "VP8X") {
      if (
        offset !== 12 ||
        canvas ||
        size !== 10 ||
        bytes[p] & ~0x10 ||
        bytes[p + 1] ||
        bytes[p + 2] ||
        bytes[p + 3]
      )
        fail();
      const u24 = (n: number) => bytes[n] | (bytes[n + 1] << 8) | (bytes[n + 2] << 16);
      canvas = { width: u24(p + 4) + 1, height: u24(p + 7) + 1 };
      alpha = !!(bytes[p] & 0x10);
    } else if (kind === "ALPH") {
      if (
        !canvas ||
        !alpha ||
        hasAlpha ||
        image ||
        size < 2 ||
        bytes[p] & 0xc0 ||
        (bytes[p] & 3) > 1 ||
        ((bytes[p] >>> 4) & 3) > 1
      )
        fail();
      if ((bytes[p] & 3) === 0 && size !== canvas!.width * canvas!.height + 1) fail();
      hasAlpha = true;
    } else {
      if (image) fail();
      if (kind === "VP8 ") {
        if (size < 11 || text(p + 3, 3) !== "\x9d\x01\x2a") fail();
        const tag = bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16);
        if (
          tag & 1 ||
          ((tag >>> 1) & 7) > 3 ||
          !(tag & 0x10) ||
          !(tag >>> 5) ||
          tag >>> 5 > size - 3 ||
          (alpha && !hasAlpha)
        )
          fail();
        image = {
          width: view.getUint16(p + 6, true) & 0x3fff,
          height: view.getUint16(p + 8, true) & 0x3fff,
        };
      } else {
        if (hasAlpha || size < 6 || bytes[p] !== 0x2f) fail();
        const bits = view.getUint32(p + 1, true);
        if (bits >>> 29 !== 0 || (canvas && !!(bits & 0x10000000) !== alpha)) fail();
        image = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      }
    }
    offset = padded;
  }
  if (
    !image?.width ||
    !image.height ||
    (canvas && (canvas.width !== image.width || canvas.height !== image.height))
  )
    fail();
  return image!;
}
