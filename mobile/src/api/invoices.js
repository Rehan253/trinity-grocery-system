import { http } from "./http";

export const createInvoiceApi = async (payload) => {
  const { data } = await http.post("/invoices/", payload);
  return data;
};

export const addInvoiceItemApi = async (invoiceId, payload) => {
  const { data } = await http.post(`/invoices/${invoiceId}/items`, payload);
  return data;
};

export const updateInvoiceItemApi = async (invoiceId, itemId, payload) => {
  const { data } = await http.patch(`/invoices/${invoiceId}/items/${itemId}`, payload);
  return data;
};

export const deleteInvoiceItemApi = async (invoiceId, itemId) => {
  const { data } = await http.delete(`/invoices/${invoiceId}/items/${itemId}`);
  return data;
};

export const getInvoiceByIdApi = async (invoiceId) => {
  const { data } = await http.get(`/invoices/${invoiceId}`);
  return data;
};

export const getMyInvoicesApi = async () => {
  const { data } = await http.get("/invoices/me");
  return data;
};
