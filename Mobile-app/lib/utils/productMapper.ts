import type { ProductDto } from "@/lib/api/types";
import { buildProductImageCandidates } from "@/lib/utils/productImageCandidates";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/utils/resolveProductImageUrl";

export { PRODUCT_IMAGE_PLACEHOLDER };

export type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
  price: string;
  priceValue: number;
  /** Try in order until one loads (stored URL, OFF CDN, placeholder). */
  imageCandidates: string[];
  barcode: string;
  details: string;
  /** Original API row for filtering */
  source: ProductDto;
};

export function formatPriceUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function mapProductDtoToCatalog(dto: ProductDto): CatalogProduct {
  const priceValue = Number(dto.price);
  const safePrice = Number.isFinite(priceValue) ? priceValue : 0;

  return {
    id: String(dto.id),
    name: dto.name?.trim() || "Product",
    unit: dto.unit?.trim() || "—",
    price: formatPriceUsd(safePrice),
    priceValue: safePrice,
    imageCandidates: buildProductImageCandidates(dto),
    barcode: (dto.barcode ?? "").trim(),
    details: dto.description?.trim() || "",
    source: dto,
  };
}
