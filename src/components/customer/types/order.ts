
export interface Order {
  id: number;
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
  id: number;
  name: string;
  products: string[];
}
