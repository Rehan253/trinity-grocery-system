import { apiClient } from "@/lib/api/client";
import type {
  AddInvoiceItemPayload,
  CreateInvoicePayload,
  CreateInvoiceResponse,
  MyInvoiceSummaryDto,
} from "@/lib/api/types";

/** GET /invoices/me — current user's orders (JWT required). */
export async function fetchMyInvoices(): Promise<MyInvoiceSummaryDto[]> {
  const { data } = await apiClient.get<MyInvoiceSummaryDto[]>("/invoices/me");
  return Array.isArray(data) ? data : [];
}

/** POST /invoices/ — create invoice draft for current user. */
export async function createInvoiceRequest(
  payload: CreateInvoicePayload,
): Promise<CreateInvoiceResponse> {
  const { data } = await apiClient.post<CreateInvoiceResponse>(
    "/invoices/",
    payload,
  );
  return data;
}

/** Backward-compatible alias used by older screens. */
export const createInvoice = createInvoiceRequest;

/** POST /invoices/:invoice_id/items — attach product rows to invoice. */
export async function addInvoiceItemRequest(
  invoiceId: number,
  payload: AddInvoiceItemPayload,
): Promise<{ new_total_amount?: number }> {
  const { data } = await apiClient.post<{ new_total_amount?: number }>(
    `/invoices/${encodeURIComponent(String(invoiceId))}/items`,
    payload,
  );
  return data;
}

/** Backward-compatible helper used by older screens. */
export async function addInvoiceItem(
  invoiceId: number,
  productId: number,
  quantity: number,
): Promise<{ new_total_amount?: number }> {
  return addInvoiceItemRequest(invoiceId, { product_id: productId, quantity });
}
