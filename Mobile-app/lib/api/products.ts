import { apiClient } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";

/** GET /products/ — public list */
export async function fetchProducts(): Promise<ProductDto[]> {
  const { data } = await apiClient.get<ProductDto[]>("/products/");
  return data;
}

/** GET /products/barcode/:barcode */
export async function fetchProductByBarcode(
  barcode: string,
): Promise<ProductDto> {
  const { data } = await apiClient.get<ProductDto>(
    `/products/barcode/${encodeURIComponent(barcode)}`,
  );
  return data;
}
