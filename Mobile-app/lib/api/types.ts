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
