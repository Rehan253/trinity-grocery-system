import { create } from "zustand";
import {
  addInvoiceItemApi,
  createInvoiceApi,
  getInvoiceByIdApi,
  getMyInvoicesApi,
} from "../api/invoices";
import { capturePaypalOrderApi, createPaypalOrderApi } from "../api/payments";

const DEFAULT_DELIVERY_ADDRESS = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  deliveryNotes: "",
};

const formatApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }
  if (error?.message) return error.message;

  return fallbackMessage;
};

const normalizeItem = (item) => {
  const productId = item?.product_id ?? item?.productId ?? item?.id;
  const quantity = Number(item?.quantity ?? 1);

  return {
    productId: Number(productId),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    name: item?.name || "",
    price: Number(item?.price || 0),
  };
};

const hasValidProduct = (item) => Number.isInteger(item.productId) && item.productId > 0;

const useCheckoutStore = create((set, get) => ({
  cartItems: [],
  deliveryAddress: { ...DEFAULT_DELIVERY_ADDRESS },
  paymentMethod: "paypal",

  invoice: null,
  purchaseHistory: [],
  paypalOrder: null,

  loading: false,
  error: null,

  setDeliveryAddress: (deliveryAddress) =>
    set((state) => ({
      deliveryAddress: { ...state.deliveryAddress, ...(deliveryAddress || {}) },
    })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod: paymentMethod || "paypal" }),

  setCartItems: (items) => {
    const normalized = Array.isArray(items) ? items.map(normalizeItem).filter(hasValidProduct) : [];
    set({ cartItems: normalized });
  },

  addToCart: (item) =>
    set((state) => {
      const normalized = normalizeItem(item);
      if (!hasValidProduct(normalized)) return state;

      const index = state.cartItems.findIndex((x) => x.productId === normalized.productId);
      if (index === -1) {
        return { cartItems: [...state.cartItems, normalized] };
      }

      const next = [...state.cartItems];
      next[index] = {
        ...next[index],
        quantity: next[index].quantity + normalized.quantity,
      };
      return { cartItems: next };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      const normalizedQuantity = Number(quantity);
      if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
        return {
          cartItems: state.cartItems.filter((item) => item.productId !== Number(productId)),
        };
      }

      return {
        cartItems: state.cartItems.map((item) =>
          item.productId === Number(productId) ? { ...item, quantity: normalizedQuantity } : item
        ),
      };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.productId !== Number(productId)),
    })),

  clearCart: () => set({ cartItems: [] }),

  createInvoiceFromCart: async () => {
    const { cartItems, deliveryAddress, paymentMethod } = get();
    if (!cartItems.length) {
      set({ error: "Cart is empty" });
      return { ok: false, error: "Cart is empty" };
    }

    set({ loading: true, error: null });
    try {
      const invoiceRes = await createInvoiceApi({
        paymentMethod,
        deliveryAddress,
      });
      const invoiceId = invoiceRes.invoice_id;

      for (const item of cartItems) {
        await addInvoiceItemApi(invoiceId, {
          product_id: item.productId,
          quantity: item.quantity,
        });
      }

      const invoice = await getInvoiceByIdApi(invoiceId);
      set({ invoice, loading: false, error: null });
      return { ok: true, invoice };
    } catch (error) {
      const message = formatApiError(error, "Failed to create invoice");
      set({ loading: false, error: message });
      return { ok: false, error: message };
    }
  },

  createPaypalOrderForInvoice: async (invoiceId) => {
    const id = invoiceId || get().invoice?.invoice_id;
    if (!id) {
      const message = "invoice_id is required";
      set({ error: message });
      return { ok: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const paypalOrder = await createPaypalOrderApi(id);
      const invoice = await getInvoiceByIdApi(id);
      set({ paypalOrder, invoice, loading: false, error: null });
      return { ok: true, paypalOrder, invoice };
    } catch (error) {
      const message = formatApiError(error, "Failed to create PayPal order");
      set({ loading: false, error: message });
      return { ok: false, error: message };
    }
  },

  capturePaypalOrderForInvoice: async ({ invoiceId, orderId } = {}) => {
    const resolvedInvoiceId = invoiceId || get().invoice?.invoice_id;
    const resolvedOrderId = orderId || get().paypalOrder?.order_id;

    if (!resolvedInvoiceId) {
      const message = "invoice_id is required";
      set({ error: message });
      return { ok: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const capture = await capturePaypalOrderApi(resolvedInvoiceId, resolvedOrderId);
      const invoice = await getInvoiceByIdApi(resolvedInvoiceId);
      set({
        invoice,
        loading: false,
        error: null,
      });

      if (invoice?.paymentStatus === "paid") {
        set({ cartItems: [] });
      }

      return { ok: true, capture, invoice };
    } catch (error) {
      const message = formatApiError(error, "Failed to capture PayPal order");
      set({ loading: false, error: message });
      return { ok: false, error: message };
    }
  },

  runPaypalCheckout: async ({ autoCapture = false } = {}) => {
    const created = await get().createInvoiceFromCart();
    if (!created.ok) return created;

    const ordered = await get().createPaypalOrderForInvoice(created.invoice.invoice_id);
    if (!ordered.ok || !autoCapture) return ordered;

    return get().capturePaypalOrderForInvoice({
      invoiceId: created.invoice.invoice_id,
      orderId: ordered.paypalOrder?.order_id,
    });
  },

  fetchPurchaseHistory: async () => {
    set({ loading: true, error: null });
    try {
      const purchaseHistory = await getMyInvoicesApi();
      set({ purchaseHistory, loading: false, error: null });
      return { ok: true, purchaseHistory };
    } catch (error) {
      const message = formatApiError(error, "Failed to load purchase history");
      set({ loading: false, error: message });
      return { ok: false, error: message };
    }
  },

  resetCheckoutState: () =>
    set({
      invoice: null,
      paypalOrder: null,
      error: null,
      loading: false,
    }),
}));

export default useCheckoutStore;
