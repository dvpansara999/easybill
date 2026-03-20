/**
 * Real PDF files start with "%PDF" (0x25 0x50 0x44 0x46), but some proxies, CDNs, or
 * tooling prepend BOM/whitespace. Find the header and return a slice from there.
 */
export function extractPdfBufferFromBytes(raw: ArrayBuffer): ArrayBuffer | null {
  const u8 = new Uint8Array(raw)
  if (u8.length < 4) return null

  const maxScan = Math.min(u8.length, 8192)

  let i = 0
  // UTF-8 BOM
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    i = 3
  }

  while (
    i < maxScan &&
    (u8[i] === 0x20 || u8[i] === 0x09 || u8[i] === 0x0a || u8[i] === 0x0d || u8[i] === 0x00)
  ) {
    i++
  }

  const isHeader = (at: number) =>
    at + 3 < u8.length &&
    u8[at] === 0x25 &&
    u8[at + 1] === 0x50 &&
    u8[at + 2] === 0x44 &&
    u8[at + 3] === 0x46

  if (isHeader(i)) {
    return raw.slice(i)
  }

  for (let j = 0; j <= maxScan - 4; j++) {
    if (isHeader(j)) {
      return raw.slice(j)
    }
  }

  return null
}
