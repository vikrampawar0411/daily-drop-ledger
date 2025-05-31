
import { useState } from "react";
import type { DateOrders, Order } from "../types/order";

export const useOrders = () => {
  const [orders, setOrders] = useState<DateOrders[]>([
    {
      date: "2024-12-01",
      orders: [
        { id: 1, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 2, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" },
        { id: 3, vendor: "Daily Essentials", product: "Indian Express", quantity: 1, unit: "copy" }
      ]
    },
    {
      date: "2024-12-02",
      orders: [
        { id: 4, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 5, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" }
      ]
    },
    {
      date: "2024-12-03",
      orders: [
        { id: 6, vendor: "Fresh Dairy Co.", product: "Fresh Milk", quantity: 2, unit: "litres" },
        { id: 7, vendor: "News Express", product: "Times of India", quantity: 1, unit: "copy" },
        { id: 8, vendor: "Daily Essentials", product: "Indian Express", quantity: 1, unit: "copy" }
      ]
    }
  ]);

  const getOrdersForDate = (date: Date): Order[] => {
    const dateString = date.toISOString().split('T')[0];
    return orders.find(order => order.date === dateString)?.orders || [];
  };

  const hasOrdersOnDate = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return orders.some(order => order.date === dateString);
  };

  const addOrder = (date: Date, order: Omit<Order, 'id'>): void => {
    const dateString = date.toISOString().split('T')[0];
    const newOrder: Order = {
      ...order,
      id: Date.now()
    };

    setOrders(prevOrders => {
      const existingDateIndex = prevOrders.findIndex(order => order.date === dateString);
      if (existingDateIndex >= 0) {
        const updatedOrders = [...prevOrders];
        updatedOrders[existingDateIndex].orders.push(newOrder);
        return updatedOrders;
      } else {
        return [...prevOrders, { date: dateString, orders: [newOrder] }];
      }
    });
  };

  const deleteOrder = (date: Date, orderId: number): void => {
    const dateString = date.toISOString().split('T')[0];
    setOrders(prevOrders => {
      return prevOrders.map(dateOrder => {
        if (dateOrder.date === dateString) {
          return {
            ...dateOrder,
            orders: dateOrder.orders.filter(order => order.id !== orderId)
          };
        }
        return dateOrder;
      }).filter(dateOrder => dateOrder.orders.length > 0);
    });
  };

  return {
    orders,
    getOrdersForDate,
    hasOrdersOnDate,
    addOrder,
    deleteOrder
  };
};
