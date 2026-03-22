/** Matches backend `auth_routes` login / me payloads (subset). */
export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

/** POST /auth/register body (matches Flask `auth_routes.register`). */
export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  state?: string;
  role?: "customer" | "admin";
};

export type RegisterResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
};

/** Backend `serialize_product` shape (subset used by the app). */
export type ProductDto = {
  id: number;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  category?: string | null;
  description?: string | null;
  unit?: string | null;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  quantity_in_stock?: number | null;
  picture_url?: string | null;
  icon?: string | null;
  dietaryTags?: string[];
  ingredients?: string[];
  rating?: number | null;
};

/** One row from GET /invoices/me */
export type MyInvoiceSummaryDto = {
  invoice_id: number;
  total_amount: number;
  created_at: string;
  payment_status: string;
  payment_method: string | null;
  item_count: number;
};

/** POST /invoices/ — deliveryAddress matches Flask `invoice_routes`. */
export type CreateInvoiceDeliveryAddress = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address: string;
  zipCode: string;
  city: string;
  state?: string;
  apartment?: string;
  deliveryNotes?: string;
};

export type CreateInvoicePayload = {
  paymentMethod?: string;
  deliveryAddress: CreateInvoiceDeliveryAddress;
};

export type CreateInvoiceResponse = {
  message: string;
  invoice_id: number;
  created_at: string;
  payment_status: string;
};
