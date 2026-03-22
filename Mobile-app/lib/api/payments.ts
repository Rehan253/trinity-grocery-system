import { apiClient } from "@/lib/api/client";

// ── Invoice ──────────────────────────────────────────────────────────

export type DeliveryAddress = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
  email?: string;
};

type CreateInvoiceResponse = {
  invoice_id: number;
  created_at: string;
  payment_status: string;
};

export async function createInvoice(
  delivery: DeliveryAddress,
  paymentMethod = "paypal",
): Promise<CreateInvoiceResponse> {
  const { data } = await apiClient.post<CreateInvoiceResponse>("/invoices/", {
    deliveryAddress: delivery,
    paymentMethod,
  });
  return data;
}

export async function addInvoiceItem(
  invoiceId: number,
  productId: number,
  quantity: number,
) {
  const { data } = await apiClient.post(`/invoices/${invoiceId}/items`, {
    product_id: productId,
    quantity,
  });
  return data;
}

// ── PayPal ───────────────────────────────────────────────────────────

type CreatePaypalOrderResponse = {
  message: string;
  order_id: string;
  approve_url: string;
  mock?: boolean;
  invoice: Record<string, unknown>;
};

export async function createPaypalOrder(
  invoiceId: number,
): Promise<CreatePaypalOrderResponse> {
  const { data } = await apiClient.post<CreatePaypalOrderResponse>(
    "/payments/paypal/create-order",
    { invoice_id: invoiceId },
  );
  return data;
}

type CapturePaypalOrderResponse = {
  message: string;
  capture_status: string;
  capture_id?: string;
  captured_amount?: string;
  invoice: Record<string, unknown>;
};

export async function capturePaypalOrder(
  invoiceId: number,
  orderId: string,
): Promise<CapturePaypalOrderResponse> {
  const { data } = await apiClient.post<CapturePaypalOrderResponse>(
    "/payments/paypal/capture-order",
    { invoice_id: invoiceId, order_id: orderId },
  );
  return data;
}
