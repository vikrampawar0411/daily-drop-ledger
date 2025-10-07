
export interface Order {
  id: string;
  vendor: string;
  product: string;
  quantity: number;
  unit: string;
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
