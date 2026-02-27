import { http } from "./http";

export const createPaypalOrderApi = async (invoiceId) => {
  const { data } = await http.post("/payments/paypal/create-order", {
    invoice_id: invoiceId,
  });
  return data;
};

export const capturePaypalOrderApi = async (invoiceId, orderId) => {
  const payload = { invoice_id: invoiceId };
  if (orderId) payload.order_id = orderId;

  const { data } = await http.post("/payments/paypal/capture-order", payload);
  return data;
};
