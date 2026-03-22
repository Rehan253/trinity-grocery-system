import { apiClient } from "@/lib/api/client";

export type PayPalCreateOrderResponse = {
  message: string;
  order_id: string;
  order_status?: string;
  approve_url: string | null;
  currency_code?: string;
  amount_value?: string;
  invoice?: {
    invoice_id: number;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
  };
};

export type PayPalCaptureResponse = {
  message: string;
  invoice?: {
    invoice_id: number;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
  };
};

/** POST /payments/paypal/create-order (JWT). */
export async function createPayPalOrder(body: {
  invoice_id: number;
  return_url?: string;
  cancel_url?: string;
}): Promise<PayPalCreateOrderResponse> {
  const { data } = await apiClient.post<PayPalCreateOrderResponse>(
    "/payments/paypal/create-order",
    body,
  );
  return data;
}

/** POST /payments/paypal/capture-order (JWT). */
export async function capturePayPalOrder(
  invoiceId: number,
  orderId?: string,
): Promise<PayPalCaptureResponse> {
  const { data } = await apiClient.post<PayPalCaptureResponse>(
    "/payments/paypal/capture-order",
    {
      invoice_id: invoiceId,
      order_id: orderId,
    },
  );
  return data;
}
