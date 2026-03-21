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

/** POST /invoices/:invoice_id/items — attach product rows to invoice. */
export async function addInvoiceItemRequest(
  invoiceId: number,
  payload: AddInvoiceItemPayload,
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/invoices/${encodeURIComponent(String(invoiceId))}/items`,
    payload,
  );
  return data;
}
