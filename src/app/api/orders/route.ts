import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { sampleMenuItems } from '@/lib/sample-data';
import {
  ORDER_ACTIVE_STATUSES,
  ORDER_LIMITS,
  ORDER_TIME,
  type ScheduledSlotValue,
} from '@/lib/constants/order';
import {
  APP_TIMEZONE,
  DATE_ONLY_FORMAT,
  type DateInput,
  formatDateOnlyInTz,
  now as dayjsNow,
  parseDateOnlyInTz,
  parseDateTimeInTz,
  parseInTz,
  toIso,
} from '@/lib/date';
import { validateScheduledSlotByRules } from '@/lib/order/scheduled-slot';
import { orderSchema } from '@/lib/schemas';
import {
  getPromotionByCode,
  validatePromotionForOrder,
} from '@/lib/server/promotion';
import { logPromotionSecurityEvent } from '@/lib/server/promotion-security-log';
import { extractClientIp } from '@/lib/server/security';

const ACTIVE_ORDER_STATUS_SET = new Set<AppTypes.Order['status']>(
  ORDER_ACTIVE_STATUSES,
);

type MenuRuleItem = {
  id: string;
  name: string;
  block_today: boolean;
  block_today_reason?: string | null;
  block_tomorrow?: boolean;
  block_tomorrow_reason?: string | null;
  blocked_delivery_dates: string[];
  blocked_delivery_date_reasons?: Record<string, string> | null;
  is_main_dish?: boolean;
  category_id?: string;
};

function validateScheduledDateSlot(
  scheduledDate: string,
  scheduledSlot: ScheduledSlotValue,
  now: DateInput = dayjsNow().valueOf(),
): { ok: true; scheduledFor: string } | { ok: false; message: string } {
  const validation = validateScheduledSlotByRules(scheduledDate, scheduledSlot, now);
  if (!validation.ok) {
    if (validation.reason === 'invalid_date') {
      return { ok: false, message: 'Ngày nhận món không hợp lệ.' };
    }
    if (validation.reason === 'invalid_slot') {
      return { ok: false, message: 'Khung giờ nhận món không hợp lệ.' };
    }
    if (validation.reason === 'past_date') {
      return { ok: false, message: 'Không thể chọn ngày trong quá khứ.' };
    }
    if (validation.reason === 'too_far_date') {
      return { ok: false, message: 'Chi cho phep dat truoc toi da 7 ngay.' };
    }
    if (validation.reason === 'after_daily_cutoff') {
      const cutoffLabel = validation.cutoffHour === 16 ? '16:00' : '14:00';
      return {
        ok: false,
        message: `Sau ${cutoffLabel}, nhà hàng không nhận đơn cho hôm nay.`,
      };
    }
    if (validation.reason === 'slot_exceeds_daily_cutoff') {
      const cutoffLabel = validation.cutoffHour === 16 ? '16:00' : '14:00';
      return {
        ok: false,
        message: `Khung giờ đã vượt giới hạn nhận đơn hôm nay (${cutoffLabel}).`,
      };
    }
    return {
      ok: false,
      message: 'Khung giờ nhận món đã qua. Vui lòng chọn khung giờ khác.',
    };
  }

  const startHourText = String(validation.slot.startHour).padStart(2, '0');
  return {
    ok: true,
    scheduledFor: parseDateTimeInTz(
      `${scheduledDate} ${startHourText}:00:00`,
      'YYYY-MM-DD HH:mm:ss',
      APP_TIMEZONE,
    ).format(),
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

function getVietnamDateValue(now: DateInput) {
  return formatDateOnlyInTz(now, APP_TIMEZONE);
}

function getVietnamTomorrowDateValue(now: DateInput) {
  return parseDateOnlyInTz(getVietnamDateValue(now)).add(1, 'day').format(
    DATE_ONLY_FORMAT,
  );
}

function getDateBlockedMenuItems(
  scheduledDate: string,
  menuItems: MenuRuleItem[],
  now: DateInput = dayjsNow().valueOf(),
) {
  const todayDateValue = getVietnamDateValue(now);
  const tomorrowDateValue = getVietnamTomorrowDateValue(now);
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
      if (menuItem.block_tomorrow && scheduledDate === tomorrowDateValue) {
        return {
          ...menuItem,
          active_reason:
            menuItem.block_tomorrow_reason?.trim() ||
            `Món "${menuItem.name}" đang tạm ngưng giao trong ngày mai.`,
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

function isMainDishMenuItem(menuItem: MenuRuleItem) {
  return menuItem.is_main_dish === true;
}

function countRecentActiveOrdersByPhoneMock(phone: string) {
  const nowMs = dayjsNow().valueOf();
  return mockDb.getAllOrders().filter((order) => {
    if (normalizeVietnamPhone(order.phone) !== phone) return false;
    if (!ACTIVE_ORDER_STATUS_SET.has(order.status)) return false;
    return (
      parseInTz(order.created_at, APP_TIMEZONE).valueOf() >
      nowMs - ORDER_TIME.PHONE_WINDOW_MS
    );
  }).length;
}

async function rollbackPromotionCounter(
  supabase: ReturnType<typeof createServerSupabase>,
  promotionId: string | null,
) {
  if (!promotionId) return;
  await supabase.rpc('rollback_promotion_consume', {
    p_promotion_id: promotionId,
  });
}

async function cleanupFailedOrderCreate(
  supabase: ReturnType<typeof createServerSupabase>,
  orderId: string,
  promotionId: string | null,
) {
  await supabase.from('orders').delete().eq('id', orderId);
  await rollbackPromotionCounter(supabase, promotionId);
}

async function countRecentActiveOrdersByPhoneSupabase(phone: string) {
  const supabase = createServerSupabase();
  const sinceIso = dayjsNow()
    .subtract(ORDER_TIME.PHONE_WINDOW_MS, 'millisecond')
    .toISOString();
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', sinceIso)
    .in('status', [...ORDER_ACTIVE_STATUSES]);
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
  const clientIp = extractClientIp(request);
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
    body.scheduled_date,
    body.scheduled_slot as ScheduledSlotValue,
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
    if (mockRecentOrderCount >= ORDER_LIMITS.PHONE_ACTIVE_ORDER_LIMIT) {
      return NextResponse.json(
        { message: phoneRateLimitMessage() },
        { status: 429 },
      );
    }

    const itemByVariantId = new Map(
      sampleMenuItems.flatMap((item) =>
        item.variants.map((variant) => [variant.id, item]),
      ),
    );
    const hasMainDish = body.items.some((item) => {
      const menuItem = itemByVariantId.get(item.variant_id);
      if (!menuItem) return false;
      return menuItem.is_main_dish === true;
    });
    if (!hasMainDish) {
      return NextResponse.json(
        { message: 'Vui lòng chọn ít nhất 1 món chính cho đơn hàng.' },
        { status: 400 },
      );
    }

    const menuItemsInOrder = Array.from(
      new Set(
        body.items
          .map((item) => itemByVariantId.get(item.variant_id))
          .filter(Boolean) as MenuRuleItem[],
      ),
    );
    const mainDishItemsInOrder = menuItemsInOrder.filter((menuItem) =>
      isMainDishMenuItem(menuItem),
    );
    const blockedMenuItems = getDateBlockedMenuItems(
      body.scheduled_date,
      mainDishItemsInOrder,
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
    const now = toIso();
    const order: AppTypes.Order = {
      id: crypto.randomUUID(),
      session_id: body.session_id,
      customer_name: body.customer_name,
      phone: normalizedPhone,
      email: body.email ?? null,
      address: body.address,
      province: body.province,
      district: body.district,
      ward: body.ward,
      note: body.note ?? null,
      scheduled_for: scheduledFor,
      total_amount: body.items.reduce(
        (sum, item) =>
          sum + item.quantity * (variantPriceMap.get(item.variant_id) ?? 10000),
        0,
      ),
      discount_amount: 0,
      promotion_id: null,
      status: 'pending',
      tracking_id: null,
      tracking_url: null,
      expired_at: null,
      created_at: now,
      updated_at: now,
    };
    const orderItems: AppTypes.OrderItem[] = body.items.map((item) => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      menu_variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: variantPriceMap.get(item.variant_id) ?? 10000,
    }));
    mockDb.createOrder(order, orderItems);
    return NextResponse.json({ orderId: order.id });
  }

  const recentOrderCount =
    await countRecentActiveOrdersByPhoneSupabase(normalizedPhone);
  if (
    recentOrderCount !== null &&
    recentOrderCount >= ORDER_LIMITS.PHONE_ACTIVE_ORDER_LIMIT
  ) {
    return NextResponse.json(
      { message: phoneRateLimitMessage() },
      { status: 429 },
    );
  }

  const supabase = createServerSupabase();
  const variantIds = body.items.map((item) => item.variant_id);
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
      'id,name,category_id,is_main_dish,block_today,block_today_reason,block_tomorrow,block_tomorrow_reason,blocked_delivery_dates,blocked_delivery_date_reasons',
    )
    .in('id', menuItemIds);
  if (menuItemsError)
    return NextResponse.json(
      { message: menuItemsError.message },
      { status: 500 },
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
        blockTomorrow: Boolean(item.block_tomorrow),
        blockTomorrowReason:
          typeof item.block_tomorrow_reason === 'string'
            ? item.block_tomorrow_reason
            : null,
        blockedDeliveryDates: (
          (item.blocked_delivery_dates ?? []) as string[]
        ).map((entry) => String(entry)),
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
    return menuItem.isMainDish;
  });
  if (!hasMainDish) {
    return NextResponse.json(
      { message: 'Vui lòng chọn ít nhất 1 món chính cho đơn hàng.' },
      { status: 400 },
    );
  }

  const menuItemsInOrder: MenuRuleItem[] = Array.from(itemById.entries()).map(
    ([id, item]) => ({
      id,
      name: item.name,
      block_today: item.blockToday,
      block_today_reason: item.blockTodayReason,
      block_tomorrow: item.blockTomorrow,
      block_tomorrow_reason: item.blockTomorrowReason,
      blocked_delivery_dates: item.blockedDeliveryDates,
      blocked_delivery_date_reasons: item.blockedDeliveryDateReasons,
      is_main_dish: item.isMainDish,
      category_id: item.categoryId,
    }),
  );
  const mainDishItemsInOrder = menuItemsInOrder.filter((menuItem) =>
    isMainDishMenuItem(menuItem),
  );
  const blockedMenuItems = getDateBlockedMenuItems(
    body.scheduled_date,
    mainDishItemsInOrder,
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
      sum + (priceByVariant.get(item.variant_id) ?? 0) * item.quantity,
    0,
  );

  let promotionId: string | null = null;
  let discountAmount = 0;
  if (body.promotion_code?.trim()) {
    const promotion = await getPromotionByCode(supabase, body.promotion_code);
    const validatedPromotion = validatePromotionForOrder(
      promotion,
      totalAmount,
    );
    if (!validatedPromotion.ok) {
      return NextResponse.json(
        { message: validatedPromotion.message },
        { status: 400 },
      );
    }

    const { data: consumed, error: consumeError } = await supabase.rpc(
      'try_consume_promotion',
      {
        p_promotion_id: validatedPromotion.promotion.id,
        p_now: new Date().toISOString(),
      },
    );
    if (consumeError) {
      await logPromotionSecurityEvent({
        eventType: 'promotion_consume_failed',
        promotionCode: body.promotion_code?.trim().toUpperCase() ?? null,
        ipAddress: clientIp || null,
        reason: consumeError.message,
      });
      return NextResponse.json(
        { message: consumeError.message },
        { status: 500 },
      );
    }
    if (!consumed) {
      await logPromotionSecurityEvent({
        eventType: 'promotion_consume_failed',
        promotionCode: body.promotion_code?.trim().toUpperCase() ?? null,
        ipAddress: clientIp || null,
        reason: 'Promotion no longer valid or usage limit reached',
      });
      return NextResponse.json(
        {
          message:
            'Mã khuyến mãi vừa hết lượt hoặc không còn hợp lệ. Vui lòng thử mã khác.',
        },
        { status: 409 },
      );
    }

    promotionId = validatedPromotion.promotion.id;
    discountAmount = validatedPromotion.discountAmount;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: body.session_id,
      customer_name: body.customer_name,
      phone: normalizedPhone,
      email: body.email ?? null,
      address: body.address,
      province: body.province,
      district: body.district,
      ward: body.ward,
      note: body.note,
      scheduled_for: scheduledFor,
      total_amount: totalAmount,
      promotion_id: promotionId,
      discount_amount: discountAmount,
      status: 'pending',
    })
    .select('id')
    .single();

  if (orderError) {
    await rollbackPromotionCounter(supabase, promotionId);
    return NextResponse.json({ message: orderError.message }, { status: 500 });
  }

  const orderItems = body.items.map((item) => ({
    order_id: order.id,
    menu_variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price: priceByVariant.get(item.variant_id) ?? 0,
  }));
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  if (itemsError) {
    await cleanupFailedOrderCreate(supabase, order.id, promotionId);
    return NextResponse.json({ message: itemsError.message }, { status: 500 });
  }

  if (promotionId) {
    const { error: usageError } = await supabase
      .from('promotion_usages')
      .insert({
        promotion_id: promotionId,
        order_id: order.id,
        discount_amount: discountAmount,
      });
    if (usageError) {
      await cleanupFailedOrderCreate(supabase, order.id, promotionId);
      return NextResponse.json(
        { message: usageError.message },
        { status: 500 },
      );
    }
  }

  await supabase.from('order_status_logs').insert({
    order_id: order.id,
    status: 'pending',
    note: 'Đơn hàng được tạo',
  });

  return NextResponse.json({ orderId: order.id });
}
