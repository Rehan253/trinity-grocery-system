import { create } from "zustand";
import { getProductByBarcodeApi } from "../api/products";

const formatApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }
  if (error?.message) return error.message;

  return fallbackMessage;
};

const useProductStore = create((set) => ({
  scannedProduct: null,
  loading: false,
  error: null,

  fetchByBarcode: async (barcode) => {
    set({ loading: true, error: null });
    try {
      const product = await getProductByBarcodeApi(barcode);
      set({ scannedProduct: product, loading: false, error: null });
      return true;
    } catch (error) {
      set({
        scannedProduct: null,
        loading: false,
        error: formatApiError(error, "Failed to fetch product"),
      });
      return false;
    }
  },

  clearScannedProduct: () => set({ scannedProduct: null, error: null }),
}));

export default useProductStore;
