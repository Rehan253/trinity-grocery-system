import { apiClient } from "@/lib/api/client";
import type {
  CreateInvoicePayload,
  CreateInvoiceResponse,
  MyInvoiceSummaryDto,
} from "@/lib/api/types";

/** GET /invoices/me — current user's orders (JWT required). */
export async function fetchMyInvoices(): Promise<MyInvoiceSummaryDto[]> {
  const { data } = await apiClient.get<MyInvoiceSummaryDto[]>("/invoices/me");
  return Array.isArray(data) ? data : [];
}

/** POST /invoices/ — create order shell (JWT). */
export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<CreateInvoiceResponse> {
  const { data } = await apiClient.post<CreateInvoiceResponse>(
    "/invoices/",
    payload,
  );
  return data;
}

/** POST /invoices/:id/items — add line (JWT). */
export async function addInvoiceItem(
  invoiceId: number,
  productId: number,
  quantity: number,
): Promise<{ new_total_amount?: number }> {
  const { data } = await apiClient.post<{ new_total_amount?: number }>(
    `/invoices/${invoiceId}/items`,
    { product_id: productId, quantity },
  );
  return data;
}
