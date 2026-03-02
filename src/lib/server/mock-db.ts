import { sampleCategories, sampleMenuItems } from '@/lib/sample-data';
import type { Category, MenuItem, Order, OrderItem, Review } from '@/lib/types';

const mockOrders: Order[] = [];
const mockOrderItems: OrderItem[] = [];
const mockOrderLogs: {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
}[] = [];
const mockReviews: Review[] = [];
const mockCategories: Category[] = [...sampleCategories];
const mockMenuItems: MenuItem[] = [...sampleMenuItems];

export const mockDb = {
  getAllOrders() {
    return [...mockOrders];
  },
  getOrdersBySession(sessionId: string) {
    return mockOrders.filter((order) => order.session_id === sessionId);
  },
  getOrderDetail(orderId: string, sessionId?: string) {
    const order = mockOrders.find((entry) => entry.id === orderId);
    if (!order) return null;
    if (sessionId && order.session_id !== sessionId) return null;
    const items = mockOrderItems
      .filter((entry) => entry.order_id === orderId)
      .map((entry) => {
        const variant = mockMenuItems
          .flatMap((item) => item.variants)
          .find((item) => item.id === entry.menu_variant_id);
        const menuItem = mockMenuItems.find(
          (item) => item.id === variant?.menu_item_id,
        );
        return {
          ...entry,
          menu_variant: variant
            ? {
                ...variant,
                menu_item: menuItem
                  ? {
                      id: menuItem.id,
                      name: menuItem.name,
                      slug: menuItem.slug,
                      thumbnail_url: menuItem.thumbnail_url,
                    }
                  : undefined,
              }
            : undefined,
        };
      });
    const logs = mockOrderLogs.filter((entry) => entry.order_id === orderId);
    const review = mockReviews.find((entry) => entry.order_id === orderId);
    return { order, items, logs, review };
  },
  getMenuDataSnapshot() {
    return { categories: [...mockCategories], menuItems: [...mockMenuItems] };
  },
  createOrder(order: Order, items: OrderItem[]) {
    mockOrders.unshift(order);
    mockOrderItems.push(...items);
    mockOrderLogs.push({
      id: crypto.randomUUID(),
      order_id: order.id,
      status: order.status,
      created_at: new Date().toISOString(),
    });
  },
  updateOrder(orderId: string, updates: Partial<Order>) {
    const idx = mockOrders.findIndex((entry) => entry.id === orderId);
    if (idx < 0) return null;
    mockOrders[idx] = {
      ...mockOrders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.status) {
      mockOrderLogs.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        status: updates.status,
        created_at: new Date().toISOString(),
      });
    }
    return mockOrders[idx];
  },
  createReview(review: Review) {
    const existed = mockReviews.find(
      (entry) => entry.order_id === review.order_id,
    );
    if (existed) return false;
    mockReviews.push(review);
    return true;
  },
  getAdminStats() {
    const stats = {
      pending: 0,
      preparing: 0,
      delivered: 0,
      total: mockOrders.length,
    };
    for (const order of mockOrders) {
      if (order.status === 'pending') stats.pending += 1;
      if (order.status === 'preparing') stats.preparing += 1;
      if (order.status === 'delivered') stats.delivered += 1;
    }
    return stats;
  },
};
