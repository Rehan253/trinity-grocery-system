import { create } from "zustand";
import { getProductByBarcodeApi } from "../api/products";
import { getCachedProductByBarcode, setCachedProductByBarcode } from "../storage/productCache";
 
const formatApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;
 
  if (data?.message) return data.message;
  if (data?.msg) return data.msg;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }
  if (error?.message) return error.message;
 
  return fallbackMessage;
};
 
const useProductStore = create((set) => ({
  scannedProduct: null,
  lastFetchSource: null,
  loading: false,
  error: null,
 
  fetchByBarcode: async (barcode) => {
    const normalized = String(barcode || "").trim();
    if (!normalized) {
      set({
        scannedProduct: null,
        lastFetchSource: null,
        loading: false,
        error: "barcode is required",
      });
      return false;
    }
 
    set({ loading: true, error: null, lastFetchSource: null });
 
    const cachedProduct = await getCachedProductByBarcode(normalized);
    if (cachedProduct) {
      set({
        scannedProduct: cachedProduct,
        lastFetchSource: "cache",
        loading: false,
        error: null,
      });
      return true;
    }
 
    try {
      const product = await getProductByBarcodeApi(normalized);
      try {
        await setCachedProductByBarcode(normalized, product);
      } catch (_error) {}
 
      set({
        scannedProduct: product,
        lastFetchSource: "network",
        loading: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        scannedProduct: null,
        lastFetchSource: null,
        loading: false,
        error: formatApiError(error, "Failed to fetch product"),
      });
      return false;
    }
  },
 
  clearScannedProduct: () =>
    set({ scannedProduct: null, lastFetchSource: null, error: null }),
}));
 
export default useProductStore;