import type { ProductDto } from "@/lib/api/types";
import { openFoodFactsImageCandidates } from "@/lib/utils/openFoodFactsImage";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  resolveProductImageUrl,
} from "@/lib/utils/resolveProductImageUrl";

/**
 * Ordered list of image URLs to try. Handles:
 * - Truncated DB URLs (255-char column) → prefer fresh OFF URLs from barcode
 * - Missing picture_url → OFF from barcode
 */
export function buildProductImageCandidates(dto: ProductDto): string[] {
  const out: string[] = [];
  const add = (u: string) => {
    const t = u.trim();
    if (!t || out.includes(t)) return;
    out.push(t);
  };

  const raw = dto.picture_url?.trim();
  const barcode = dto.barcode?.trim() ?? "";

  // Stored URL is often truncated in SQLAlchemy String(255) → broken; OFF paths still work.
  const storedLooksTruncated =
    !!raw &&
    raw.length >= 250 &&
    !/\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(raw);

  if (raw && !storedLooksTruncated) {
    add(resolveProductImageUrl(raw));
  }

  for (const u of openFoodFactsImageCandidates(barcode)) {
    add(u);
  }

  if (raw && storedLooksTruncated) {
    add(resolveProductImageUrl(raw));
  }

  add(PRODUCT_IMAGE_PLACEHOLDER);
  return out;
}
