/**
 * Build Open Food Facts CDN paths from a barcode (same nesting as openfoodfacts.org).
 * @see https://github.com/openfoodfacts/openfoodfacts-server
 */
export function openFoodFactsProductPath(barcode: string): string | null {
  const digits = barcode.replace(/\D/g, "");
  if (digits.length < 8) return null;

  let b = digits;
  if (b.length > 13) b = b.slice(-13);
  while (b.length < 13) b = `0${b}`;

  return `${b.slice(0, 3)}/${b.slice(3, 6)}/${b.slice(6, 9)}/${b.slice(9, 13)}`;
}

/** Try several common OFF front-image filenames (revision varies per product). */
export function openFoodFactsImageCandidates(
  barcode: string | null | undefined,
): string[] {
  const path = barcode?.trim() ? openFoodFactsProductPath(barcode.trim()) : null;
  if (!path) return [];

  const base = `https://images.openfoodfacts.org/images/products/${path}`;
  return [
    `${base}/front_en.400.jpg`,
    `${base}/front_en.200.jpg`,
    `${base}/front.400.jpg`,
    `${base}/front.200.jpg`,
    `${base}/front_en.3.400.jpg`,
    `${base}/front_en.6.400.jpg`,
  ];
}
