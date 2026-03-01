export type MediaType = 'image' | 'video';

export interface Category {
	id: string;
	name: string;
	slug: string;
	sort_order: number;
}

export interface MenuMedia {
	id: string;
	menu_item_id: string;
	type: MediaType;
	url: string;
	alt_text: string | null;
	sort_order: number;
}

export interface MenuVariant {
	id: string;
	menu_item_id: string;
	name: string;
	price: number;
	serves_min: number | null;
	serves_max: number | null;
	is_default: boolean;
}

export interface MenuItem {
	id: string;
	category_id: string;
	name: string;
	slug: string;
	description: string | null;
	ingredients: string | null;
	thumbnail_url: string | null;
	is_available: boolean;
	is_topping: boolean;
	sort_order: number;
	variants: MenuVariant[];
	media: MenuMedia[];
}

export type OrderStatus =
	| 'pending'
	| 'confirmed'
	| 'preparing'
	| 'shipping'
	| 'delivered'
	| 'cancelled';

export interface Order {
	id: string;
	session_id: string;
	customer_name: string;
	phone: string;
	address: string;
	province: string;
	district: string;
	ward: string;
	note: string | null;
	total_amount: number;
	status: OrderStatus;
	tracking_id: string | null;
	tracking_url: string | null;
	created_at: string;
	updated_at: string;
}

export interface OrderItem {
	id: string;
	order_id: string;
	menu_variant_id: string;
	quantity: number;
	unit_price: number;
	menu_variant?: MenuVariant & {
		menu_item?: Pick<MenuItem, 'id' | 'name' | 'slug' | 'thumbnail_url'>;
	};
}

export interface Review {
	id: string;
	order_id: string;
	session_id: string;
	rating: number;
	comment: string;
	created_at: string;
}

export interface CartLine {
	variantId: string;
	itemId: string;
	itemName: string;
	itemSlug: string;
	variantName: string;
	price: number;
	quantity: number;
	thumbnailUrl?: string | null;
}
