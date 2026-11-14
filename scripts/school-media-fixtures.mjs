// Synthetic header fixtures for unit tests; not photographs or production data.
export function fixtureWebp(width, height, size = 40) {
  size = Math.max(32, size + (size % 2));
  const bytes = new Uint8Array(size),
    view = new DataView(bytes.buffer);
  const text = (value, p) => bytes.set(new TextEncoder().encode(value), p);
  text("RIFF", 0);
  view.setUint32(4, size - 8, true);
  text("WEBPVP8 ", 8);
  view.setUint32(16, size - 20, true);
  bytes[20] = 0x30; // Key frame, show_frame, one-byte first partition (synthetic header).
  bytes.set([0x9d, 0x01, 0x2a], 23);
  view.setUint16(26, width, true);
  view.setUint16(28, height, true);
  return bytes;
}
export function fixtureJpeg(width, height) {
  const bytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe1, 0, 10, 69, 120, 105, 102, 71, 80, 83, 0, 0xff, 0xc0, 0, 11, 8, 0, 0, 0,
    0, 1, 1, 0, 0,
  ]);
  const view = new DataView(bytes.buffer);
  view.setUint16(19, height);
  view.setUint16(21, width);
  return bytes;
}
