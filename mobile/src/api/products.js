import { http } from "./http";

export const getProductByBarcodeApi = async (barcode) => {
  const normalized = String(barcode || "").trim();
  const { data } = await http.get(`/products/barcode/${encodeURIComponent(normalized)}`);
  return data;
};
