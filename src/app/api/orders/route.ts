import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { sampleCategories, sampleMenuItems } from '@/lib/sample-data';
import { orderSchema } from '@/lib/utils/validation';
import type { Order, OrderItem } from '@/lib/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const PHONE_WINDOW_MS = 60 * 60 * 1000;
const PHONE_ACTIVE_ORDER_LIMIT = 3;
const ACTIVE_ORDER_STATUSES: Order['status'][] = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
];
const ACTIVE_ORDER_STATUS_SET = new Set<Order['status']>(ACTIVE_ORDER_STATUSES);
const SCHEDULED_SLOTS = {
  '10:00-12:00': { startHour: 10, endHour: 12 },
  '12:00-14:00': { startHour: 12, endHour: 14 },
  '14:00-16:00': { startHour: 14, endHour: 16 },
  '16:00-18:00': { startHour: 16, endHour: 18 },
  '18:00-20:00': { startHour: 18, endHour: 20 },
} as const;

type MenuRuleItem = {
  id: string;
  name: string;
  block_today: boolean;
  block_today_reason?: string | null;
  blocked_delivery_dates: string[];
  blocked_delivery_date_reasons?: Record<string, string> | null;
  is_main_dish?: boolean;
  category_id?: string;
};

function toVietnamClock(now: Date) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

function getCutoffHour(vnDate: Date) {
  const dayOfWeek = vnDate.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6 ? 16 : 14;
}

function parseVietnamDateString(value: string) {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function validateScheduledDateSlot(
  scheduledDate: string,
  scheduledSlot: keyof typeof SCHEDULED_SLOTS,
  now: Date = new Date(),
): { ok: true; scheduledFor: string } | { ok: false; message: string } {
  const parsedDate = parseVietnamDateString(scheduledDate);
  if (!parsedDate) {
    return { ok: false, message: 'Ngày nhận món không hợp lệ.' };
  }
  const year = parsedDate.getUTCFullYear();
  const month = parsedDate.getUTCMonth() + 1;
  const day = parsedDate.getUTCDate();

  const vnNow = toVietnamClock(now);
  const todayInVietnam = Date.UTC(
    vnNow.getUTCFullYear(),
    vnNow.getUTCMonth(),
    vnNow.getUTCDate(),
  );
  const targetInVietnam = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((targetInVietnam - todayInVietnam) / DAY_MS);
  const cutoffHour = getCutoffHour(parsedDate);
  const slot = SCHEDULED_SLOTS[scheduledSlot];

  if (!slot) {
    return { ok: false, message: 'Khung giờ nhận món không hợp lệ.' };
  }

  if (diffDays < 0) {
    return { ok: false, message: 'Không thể chọn ngày trong quá khứ.' };
  }
  if (diffDays > 7) {
    return { ok: false, message: 'Chi cho phep dat truoc toi da 7 ngay.' };
  }
  if (diffDays === 0) {
    const currentHour = vnNow.getUTCHours();
    const currentMinuteOfDay = currentHour * 60 + vnNow.getUTCMinutes();
    const slotStartMinute = slot.startHour * 60;
    if (currentHour >= cutoffHour) {
      const cutoffLabel = cutoffHour === 16 ? '16:00' : '14:00';
      return {
        ok: false,
        message: `Sau ${cutoffLabel}, nhà hàng không nhận đơn cho hôm nay.`,
      };
    }
    if (slot.endHour > cutoffHour) {
      const cutoffLabel = cutoffHour === 16 ? '16:00' : '14:00';
      return {
        ok: false,
        message: `Khung giờ đã vượt giới hạn nhận đơn hôm nay (${cutoffLabel}).`,
      };
    }
    if (slotStartMinute < currentMinuteOfDay) {
      return {
        ok: false,
        message: 'Khung giờ nhận món đã qua. Vui lòng chọn khung giờ khác.',
      };
    }
  }

  const startHourText = String(slot.startHour).padStart(2, '0');
  return {
    ok: true,
    scheduledFor: `${scheduledDate}T${startHourText}:00:00+07:00`,
  };
}

function normalizeVietnamPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`;
  if (digits.startsWith('84')) return `0${digits.slice(2)}`;
  return digits;
}

function phoneRateLimitMessage() {
  return 'Số điện thoại này có quá nhiều đơn đang xử lý. Vui lòng thử lại sau.';
}

function getVietnamDateValue(now: Date) {
  const vnNow = toVietnamClock(now);
  const year = vnNow.getUTCFullYear();
  const month = String(vnNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnNow.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateBlockedMenuItems(
  scheduledDate: string,
  menuItems: MenuRuleItem[],
  now: Date = new Date(),
) {
  const todayDateValue = getVietnamDateValue(now);
  return menuItems
    .map((menuItem) => {
      if (menuItem.block_today && scheduledDate === todayDateValue) {
        return {
          ...menuItem,
          active_reason:
            menuItem.block_today_reason?.trim() ||
            `Món "${menuItem.name}" đang tạm ngưng giao hôm nay.`,
        };
      }
      if (menuItem.blocked_delivery_dates.includes(scheduledDate)) {
        const reasonByDate = menuItem.blocked_delivery_date_reasons ?? {};
        return {
          ...menuItem,
          active_reason:
            reasonByDate[scheduledDate]?.trim() ||
            `Món "${menuItem.name}" không giao trong ngày đã chọn.`,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<MenuRuleItem & { active_reason: string }>;
}

function countRecentActiveOrdersByPhoneMock(phone: string) {
  const now = Date.now();
  return mockDb.getAllOrders().filter((order) => {
    if (normalizeVietnamPhone(order.phone) !== phone) return false;
    if (!ACTIVE_ORDER_STATUS_SET.has(order.status)) return false;
    return new Date(order.created_at).getTime() > now - PHONE_WINDOW_MS;
  }).length;
}

async function countRecentActiveOrdersByPhoneSupabase(phone: string) {
  const supabase = createServerSupabase();
  const sinceIso = new Date(Date.now() - PHONE_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', sinceIso)
    .in('status', [...ACTIVE_ORDER_STATUSES]);
  if (error) return null;
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId)
    return NextResponse.json({ message: 'Thiếu sessionId' }, { status: 400 });

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ orders: mockDb.getOrdersBySession(sessionId) });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  const body = parsed.data;
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ orderId: crypto.randomUUID() });
  }

  const normalizedPhone = normalizeVietnamPhone(body.phone);
  const scheduledValidation = validateScheduledDateSlot(
    body.scheduledDate,
    body.scheduledSlot as keyof typeof SCHEDULED_SLOTS,
  );
  if (!scheduledValidation.ok) {
    return NextResponse.json(
      { message: scheduledValidation.message },
      { status: 400 },
    );
  }
  const scheduledFor = scheduledValidation.scheduledFor;

  if (!hasSupabaseConfig()) {
    const mockRecentOrderCount =
      countRecentActiveOrdersByPhoneMock(normalizedPhone);
    if (mockRecentOrderCount >= PHONE_ACTIVE_ORDER_LIMIT) {
      return NextResponse.json(
        { message: phoneRateLimitMessage() },
        { status: 429 },
      );
    }

    const categoryById = new Map(
      sampleCategories.map((category) => [category.id, category.slug]),
    );
    const itemByVariantId = new Map(
      sampleMenuItems.flatMap((item) =>
        item.variants.map((variant) => [variant.id, item]),
      ),
    );
    const hasMainDish = body.items.some((item) => {
      const menuItem = itemByVariantId.get(item.variantId);
      if (!menuItem) return false;
      if (menuItem.is_main_dish) return true;
      return categoryById.get(menuItem.category_id) === 'lau';
    });
    if (!hasMainDish) {
      return NextResponse.json(
        { message: 'Vui lòng chọn ít nhất 1 món lẩu cho đơn hàng.' },
        { status: 400 },
      );
    }

    const menuItemsInOrder = Array.from(
      new Set(
        body.items
          .map((item) => itemByVariantId.get(item.variantId))
          .filter(Boolean) as MenuRuleItem[],
      ),
    );
    const blockedMenuItems = getDateBlockedMenuItems(
      body.scheduledDate,
      menuItemsInOrder,
    );
    if (blockedMenuItems.length > 0) {
      return NextResponse.json(
        {
          message: blockedMenuItems.map((item) => item.active_reason).join(' '),
        },
        { status: 400 },
      );
    }

    const variantPriceMap = new Map(
      sampleMenuItems.flatMap((item) =>
        item.variants.map((variant) => [variant.id, variant.price]),
      ),
    );
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      session_id: body.sessionId,
      customer_name: body.customerName,
      phone: normalizedPhone,
      address: body.address,
      province: body.province,
      district: body.district,
      ward: body.ward,
      note: body.note ?? null,
      scheduled_for: scheduledFor,
      total_amount: body.items.reduce(
        (sum, item) =>
          sum + item.quantity * (variantPriceMap.get(item.variantId) ?? 10000),
        0,
      ),
      status: 'pending',
      tracking_id: null,
      tracking_url: null,
      expired_at: null,
      created_at: now,
      updated_at: now,
    };
    const orderItems: OrderItem[] = body.items.map((item) => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      menu_variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: variantPriceMap.get(item.variantId) ?? 10000,
    }));
    mockDb.createOrder(order, orderItems);
    return NextResponse.json({ orderId: order.id });
  }

  const recentOrderCount =
    await countRecentActiveOrdersByPhoneSupabase(normalizedPhone);
  if (
    recentOrderCount !== null &&
    recentOrderCount >= PHONE_ACTIVE_ORDER_LIMIT
  ) {
    return NextResponse.json(
      { message: phoneRateLimitMessage() },
      { status: 429 },
    );
  }

  const supabase = createServerSupabase();
  const variantIds = body.items.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from('menu_variants')
    .select('id,price,menu_item_id')
    .in('id', variantIds);
  if (variantsError)
    return NextResponse.json(
      { message: variantsError.message },
      { status: 500 },
    );

  const menuItemIds = [
    ...new Set(
      (variants ?? []).map((variant) => variant.menu_item_id as string),
    ),
  ];
  const { data: menuItems, error: menuItemsError } = await supabase
    .from('menu_items')
    .select(
      'id,name,category_id,is_main_dish,block_today,block_today_reason,blocked_delivery_dates,blocked_delivery_date_reasons',
    )
    .in('id', menuItemIds);
  if (menuItemsError)
    return NextResponse.json(
      { message: menuItemsError.message },
      { status: 500 },
    );

  const categoryIds = [
    ...new Set(
      (menuItems ?? []).map((menuItem) => menuItem.category_id as string),
    ),
  ];
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id,slug')
    .in('id', categoryIds);
  if (categoriesError)
    return NextResponse.json(
      { message: categoriesError.message },
      { status: 500 },
    );

  const categoryById = new Map(
    (categories ?? []).map((category) => [
      category.id as string,
      category.slug as string,
    ]),
  );
  const itemById = new Map(
    (menuItems ?? []).map((item) => [
      item.id as string,
      {
        categoryId: item.category_id as string,
        isMainDish: Boolean(item.is_main_dish),
        name: item.name as string,
        blockToday: Boolean(item.block_today),
        blockTodayReason:
          typeof item.block_today_reason === 'string'
            ? item.block_today_reason
            : null,
        blockedDeliveryDates: ((item.blocked_delivery_dates ?? []) as string[]).map(
          (entry) => String(entry),
        ),
        blockedDeliveryDateReasons:
          item.blocked_delivery_date_reasons &&
          typeof item.blocked_delivery_date_reasons === 'object' &&
          !Array.isArray(item.blocked_delivery_date_reasons)
            ? (item.blocked_delivery_date_reasons as Record<string, string>)
            : {},
      },
    ]),
  );
  const hasMainDish = (variants ?? []).some((variant) => {
    const menuItem = itemById.get(variant.menu_item_id as string);
    if (!menuItem) return false;
    if (menuItem.isMainDish) return true;
    return categoryById.get(menuItem.categoryId) === 'lau';
  });
  if (!hasMainDish) {
    return NextResponse.json(
      { message: 'Vui lòng chọn ít nhất 1 món lẩu cho đơn hàng.' },
      { status: 400 },
    );
  }

  const menuItemsInOrder: MenuRuleItem[] = Array.from(itemById.entries()).map(
    ([id, item]) => ({
      id,
      name: item.name,
      block_today: item.blockToday,
      block_today_reason: item.blockTodayReason,
      blocked_delivery_dates: item.blockedDeliveryDates,
      blocked_delivery_date_reasons: item.blockedDeliveryDateReasons,
      is_main_dish: item.isMainDish,
      category_id: item.categoryId,
    }),
  );
  const blockedMenuItems = getDateBlockedMenuItems(
    body.scheduledDate,
    menuItemsInOrder,
  );
  if (blockedMenuItems.length > 0) {
    return NextResponse.json(
      {
        message: blockedMenuItems.map((item) => item.active_reason).join(' '),
      },
      { status: 400 },
    );
  }

  const priceByVariant = new Map(
    (variants ?? []).map((variant) => [variant.id, variant.price as number]),
  );
  const totalAmount = body.items.reduce(
    (sum, item) =>
      sum + (priceByVariant.get(item.variantId) ?? 0) * item.quantity,
    0,
  );

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: body.sessionId,
      customer_name: body.customerName,
      phone: normalizedPhone,
      address: body.address,
      province: body.province,
      district: body.district,
      ward: body.ward,
      note: body.note,
      scheduled_for: scheduledFor,
      total_amount: totalAmount,
      status: 'pending',
    })
    .select('id')
    .single();

  if (orderError)
    return NextResponse.json({ message: orderError.message }, { status: 500 });

  const orderItems = body.items.map((item) => ({
    order_id: order.id,
    menu_variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: priceByVariant.get(item.variantId) ?? 0,
  }));
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  if (itemsError)
    return NextResponse.json({ message: itemsError.message }, { status: 500 });

  await supabase.from('order_status_logs').insert({
    order_id: order.id,
    status: 'pending',
    note: 'Đơn hàng được tạo',
  });

  return NextResponse.json({ orderId: order.id });
}
