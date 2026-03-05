export {};

declare global {
  namespace AppTypes {
    type MediaType = 'image' | 'video';

    interface Category {
      id: string;
      name: string;
      slug: string;
      sort_order: number;
    }

    interface MenuMedia {
      id: string;
      menu_item_id: string;
      type: MediaType;
      url: string;
      alt_text: string | null;
      sort_order: number;
    }

    interface MenuVariant {
      id: string;
      menu_item_id: string;
      name: string;
      price: number;
      serves_min: number | null;
      serves_max: number | null;
      is_default: boolean;
    }

    interface MenuItem {
      id: string;
      category_id: string;
      name: string;
      slug: string;
      description: string | null;
      ingredients: string | null;
      note: string | null;
      preparation_time_minutes: number | null;
      thumbnail_url: string | null;
      is_available: boolean;
      is_topping: boolean;
      is_main_dish: boolean;
      block_today: boolean;
      block_today_reason: string | null;
      block_tomorrow: boolean;
      block_tomorrow_reason: string | null;
      blocked_delivery_dates: string[];
      blocked_delivery_date_reasons: Record<string, string>;
      sort_order: number;
      variants: MenuVariant[];
      media: MenuMedia[];
    }

    type OrderStatus =
      | 'pending'
      | 'confirmed'
      | 'preparing'
      | 'shipping'
      | 'delivered'
      | 'cancelled';
    type PromotionType = 'fixed_amount' | 'percentage';

    interface Order {
      id: string;
      session_id: string;
      customer_name: string;
      phone: string;
      email: string | null;
      address: string;
      province: string;
      district: string;
      ward: string;
      note: string | null;
      scheduled_for: string | null;
      total_amount: number;
      discount_amount: number;
      promotion_id: string | null;
      status: OrderStatus;
      tracking_id: string | null;
      tracking_url: string | null;
      expired_at: string | null;
      customer_last_seen_message_at?: string | null;
      admin_last_seen_message_at?: string | null;
      created_at: string;
      updated_at: string;
    }

    interface Promotion {
      id: string;
      code: string;
      type: PromotionType;
      discount_value: number;
      max_discount_amount: number | null;
      min_order_amount: number;
      max_usage: number | null;
      used_count: number;
      valid_from: string;
      valid_until: string;
      is_active: boolean;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    interface PromotionUsage {
      id: string;
      promotion_id: string;
      order_id: string;
      discount_amount: number;
      created_at: string;
    }

    interface OrderItem {
      id: string;
      order_id: string;
      menu_variant_id: string;
      quantity: number;
      unit_price: number;
      menu_variant?: MenuVariant & {
        menu_item?: Pick<MenuItem, 'id' | 'name' | 'slug' | 'thumbnail_url'>;
      };
    }

    interface Review {
      id: string;
      order_id: string;
      session_id: string;
      rating: number;
      comment: string;
      created_at: string;
    }

    type MessageSenderType = 'customer' | 'admin';

    interface OrderMessage {
      id: string;
      order_id: string;
      sender_type: MessageSenderType;
      sender_id: string;
      content: string | null;
      images: string[];
      created_at: string;
    }

    interface CartLine {
      variantId: string;
      itemId: string;
      itemName: string;
      itemSlug: string;
      variantName: string;
      itemNote?: string | null;
      price: number;
      quantity: number;
      thumbnailUrl?: string | null;
    }
  }
}
