import type { ProductDto } from "@/lib/api/types";

/** When API has no image URL */
export const PRODUCT_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=60";

export type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
  price: string;
  priceValue: number;
  imageUri: string;
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
    imageUri: dto.picture_url?.trim() || PRODUCT_IMAGE_PLACEHOLDER,
    barcode: (dto.barcode ?? "").trim(),
    details: dto.description?.trim() || "",
    source: dto,
  };
}
