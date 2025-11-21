
export interface Order {
  id: string;
  vendor: string;
  product: string;
  quantity: number;
  unit: string;
  vendor_id?: string;
  product_id?: string;
  order_date?: string;
  status?: string;
  order_type?: 'auto' | 'request';
}

export interface DateOrders {
  date: string;
  orders: Order[];
}

export interface Vendor {
  id: string;
  name: string;
  products: { id: string; name: string }[];
}
