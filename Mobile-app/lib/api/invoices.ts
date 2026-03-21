import { apiClient } from "@/lib/api/client";
import type { MyInvoiceSummaryDto } from "@/lib/api/types";

/** GET /invoices/me — current user's orders (JWT required). */
export async function fetchMyInvoices(): Promise<MyInvoiceSummaryDto[]> {
  const { data } = await apiClient.get<MyInvoiceSummaryDto[]>("/invoices/me");
  return Array.isArray(data) ? data : [];
}
