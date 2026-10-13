export type OrderItem = {
  product_name: string;
  variant_title: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type Order = {
  id: string;
  status: string;
  status_display: string;
  full_name: string;
  phone: string;
  address: string;
  comment: string;
  total: string;
  currency: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  can_cancel: boolean;
};

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();