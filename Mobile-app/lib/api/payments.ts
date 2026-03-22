import { apiClient } from "@/lib/api/client";
import type {
  PaypalCaptureOrderResponse,
  PaypalCreateOrderResponse,
} from "@/lib/api/types";

/** POST /payments/paypal/create-order */
export async function createPaypalOrderRequest(
  invoiceId: number,
): Promise<PaypalCreateOrderResponse> {
  const { data } = await apiClient.post<PaypalCreateOrderResponse>(
    "/payments/paypal/create-order",
    { invoice_id: invoiceId },
  );
  return data;
}

/** Backward-compatible alias used by older screens. */
export const createPaypalOrder = createPaypalOrderRequest;

/** POST /payments/paypal/capture-order */
export async function capturePaypalOrderRequest(
  invoiceId: number,
  orderId?: string,
): Promise<PaypalCaptureOrderResponse> {
  const payload: { invoice_id: number; order_id?: string } = {
    invoice_id: invoiceId,
  };
  if (orderId) {
    payload.order_id = orderId;
  }

  const { data } = await apiClient.post<PaypalCaptureOrderResponse>(
    "/payments/paypal/capture-order",
    payload,
  );
  return data;
}

/** Backward-compatible alias used by older screens. */
export const capturePaypalOrder = capturePaypalOrderRequest;
