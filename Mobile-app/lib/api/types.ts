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
  refresh_token: string;
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

export type DeliveryAddressPayload = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  zipCode: string;
  deliveryNotes?: string;
};

/** Backward-compatible alias for older payment flow code. */
export type CreateInvoiceDeliveryAddress = DeliveryAddressPayload;

export type CreateInvoicePayload = {
  paymentMethod?: "paypal" | "card" | "cod";
  deliveryAddress: DeliveryAddressPayload;
};

export type CreateInvoiceResponse = {
  message: string;
  invoice_id: number;
  created_at: string;
  payment_status: string;
};

export type AddInvoiceItemPayload = {
  product_id: number;
  quantity: number;
};

export type PaypalCreateOrderResponse = {
  message: string;
  order_id: string;
  order_status?: string;
  approve_url?: string | null;
  amount_value?: string;
  currency_code?: string;
  mock?: boolean;
  invoice?: Record<string, unknown>;
};

export type PaypalCaptureOrderResponse = {
  message: string;
  capture_status: string;
  capture_id?: string | null;
  captured_amount?: string;
  currency_code?: string | null;
  algolia_purchase_event?: {
    sent: boolean;
    reason?: string;
  };
  invoice?: Record<string, unknown>;
};

export type RecommendationItemDto = {
  objectID: string;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  picture_url?: string | null;
};

export type RecommendationsResponse = {
  user_id: number;
  purchased_product_ids: number[];
  checkout_based_count: number;
  also_bought_count: number;
  recommended_count: number;
  checkout_based: RecommendationItemDto[];
  also_bought: RecommendationItemDto[];
  recommendations: RecommendationItemDto[];
};
