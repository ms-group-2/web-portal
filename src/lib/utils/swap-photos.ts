/** Placeholder when a listing has no usable image URLs. */
export const SWAP_PHOTO_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';

/** Split comma- or pipe-separated URL lists sometimes returned as one field. */
function splitPhotoUrls(s: string): string[] {
  const t = s.trim();
  if (!t) return [];
  const bySep = t.split(/[,|]/).map((p) => p.trim()).filter(Boolean);
  if (bySep.length > 1) return bySep;
  return [t];
}

/**
 * Coerce API `photos` into a flat list of image URLs (strings, nested `{url}`, comma-separated).
 */
export function normalizeSwapPhotos(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    return splitPhotoUrls(raw);
  }
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const entry of raw) {
      if (typeof entry === 'string') {
        out.push(...splitPhotoUrls(entry));
      } else if (entry && typeof entry === 'object' && 'url' in (entry as object)) {
        const u = String((entry as { url: unknown }).url);
        if (u) out.push(...splitPhotoUrls(u));
      }
    }
    return [...new Set(out)].filter(Boolean);
  }
  return [];
}
