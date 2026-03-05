import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabase,
  deleteStorageFiles,
  hasSupabaseConfig,
} from '@/lib/server/supabase';
import { toSlug } from '@/lib/utils/format';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type VariantPayload = {
  name: string;
  price: number;
  serves_min: number | null;
  serves_max: number | null;
  is_default: boolean;
};

function normalizeBlockedDeliveryDates(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry));
}

function normalizeOptionalText(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  return value.length > 0 ? value : null;
}

function normalizeBlockedDeliveryDateReasons(
  input: unknown,
): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result: Record<string, string> = {};
  for (const [date, reason] of Object.entries(input as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (typeof reason !== 'string') continue;
    const trimmed = reason.trim();
    if (!trimmed) continue;
    result[date] = trimmed;
  }
  return result;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeVariants(input: any[]): VariantPayload[] {
  const normalized = input
    .map((entry) => ({
      name: typeof entry?.name === 'string' ? entry.name.trim() : '',
      price: Number(entry?.price),
      serves_min:
        entry?.servesMin === null ||
        entry?.servesMin === undefined ||
        entry?.servesMin === ''
          ? null
          : Number(entry.servesMin),
      serves_max:
        entry?.servesMax === null ||
        entry?.servesMax === undefined ||
        entry?.servesMax === ''
          ? null
          : Number(entry.servesMax),
      is_default: Boolean(entry?.isDefault),
    }))
    .filter(
      (entry) =>
        entry.name.length > 0 &&
        Number.isFinite(entry.price) &&
        entry.price >= 0,
    )
    .map((entry) => ({
      ...entry,
      price: Math.round(entry.price),
      serves_min:
        entry.serves_min === null || !Number.isFinite(entry.serves_min)
          ? null
          : Math.round(entry.serves_min),
      serves_max:
        entry.serves_max === null || !Number.isFinite(entry.serves_max)
          ? null
          : Math.round(entry.serves_max),
    }));

  if (normalized.length === 0) return [];

  let defaultIndex = normalized.findIndex((entry) => entry.is_default);
  if (defaultIndex < 0) defaultIndex = 0;
  return normalized.map((entry, index) => ({
    ...entry,
    is_default: index === defaultIndex,
  }));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  const params = await context.params;
  const body = await request.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );

  const supabase = createServerSupabase();
  const [
    { data: existingItem, error: existingItemError },
    { data: existingMedia, error: existingMediaError },
  ] = await Promise.all([
    supabase
      .from('menu_items')
      .select('thumbnail_url')
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('menu_media').select('url').eq('menu_item_id', params.id),
  ]);

  if (existingItemError) {
    return NextResponse.json(
      { message: existingItemError.message },
      { status: 500 },
    );
  }
  if (existingMediaError) {
    return NextResponse.json(
      { message: existingMediaError.message },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from('menu_items')
    .update({
      category_id: body.categoryId,
      name: body.name,
      slug: body.name ? toSlug(body.name) : undefined,
      description: body.description,
      ingredients: body.ingredients,
      note: body.note,
      preparation_time_minutes: body.preparationTimeMinutes,
      thumbnail_url: body.thumbnailUrl,
      is_available: body.isAvailable,
      is_topping: body.isTopping,
      is_main_dish: Boolean(body.isMainDish),
      block_today: Boolean(body.blockToday),
      block_today_reason: normalizeOptionalText(body.blockTodayReason),
      block_tomorrow: Boolean(body.blockTomorrow),
      block_tomorrow_reason: normalizeOptionalText(body.blockTomorrowReason),
      blocked_delivery_dates: normalizeBlockedDeliveryDates(
        body.blockedDeliveryDates,
      ),
      blocked_delivery_date_reasons: normalizeBlockedDeliveryDateReasons(
        body.blockedDeliveryDateReasons,
      ),
      sort_order: body.sortOrder,
    })
    .eq('id', params.id);
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  if (Array.isArray(body.media)) {
    const { error: deleteMediaError } = await supabase
      .from('menu_media')
      .delete()
      .eq('menu_item_id', params.id);
    if (deleteMediaError)
      return NextResponse.json(
        { message: deleteMediaError.message },
        { status: 500 },
      );

    if (body.media.length > 0) {
      const { error: insertMediaError } = await supabase
        .from('menu_media')
        .insert(
          body.media.map((entry: any, index: number) => ({
            menu_item_id: params.id,
            type: entry.type,
            url: entry.url,
            alt_text: entry.altText ?? null,
            sort_order: index + 1,
          })),
        );
      if (insertMediaError)
        return NextResponse.json(
          { message: insertMediaError.message },
          { status: 500 },
        );
    }
  }

  if (Array.isArray(body.variants)) {
    const normalizedVariants = normalizeVariants(body.variants);
    const variantsToInsert =
      normalizedVariants.length > 0
        ? normalizedVariants
        : [
            {
              name: 'Mặc định',
              price: 0,
              serves_min: null,
              serves_max: null,
              is_default: true,
            },
          ];
    const { error: deleteVariantsError } = await supabase
      .from('menu_variants')
      .delete()
      .eq('menu_item_id', params.id);
    if (deleteVariantsError)
      return NextResponse.json(
        { message: deleteVariantsError.message },
        { status: 500 },
      );

    const { error: insertVariantsError } = await supabase
      .from('menu_variants')
      .insert(
        variantsToInsert.map((entry) => ({
          menu_item_id: params.id,
          name: entry.name,
          price: entry.price,
          serves_min: entry.serves_min,
          serves_max: entry.serves_max,
          is_default: entry.is_default,
        })),
      );
    if (insertVariantsError)
      return NextResponse.json(
        { message: insertVariantsError.message },
        { status: 500 },
      );
  }

  const oldUrls = new Set<string>();
  if (
    typeof existingItem?.thumbnail_url === 'string' &&
    existingItem.thumbnail_url.length > 0
  ) {
    oldUrls.add(existingItem.thumbnail_url);
  }
  for (const entry of existingMedia ?? []) {
    if (typeof entry.url === 'string' && entry.url.length > 0) {
      oldUrls.add(entry.url);
    }
  }

  const newUrls = new Set<string>();
  if (typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.length > 0) {
    newUrls.add(body.thumbnailUrl);
  }
  if (Array.isArray(body.media)) {
    for (const entry of body.media) {
      if (typeof entry?.url === 'string' && entry.url.length > 0) {
        newUrls.add(entry.url);
      }
    }
  }

  const removedUrls = Array.from(oldUrls).filter((url) => !newUrls.has(url));
  await deleteStorageFiles(removedUrls);

  const [
    { data: updatedItem, error: updatedItemError },
    { data: updatedVariants, error: updatedVariantsError },
    { data: updatedMedia, error: updatedMediaError },
  ] = await Promise.all([
    supabase.from('menu_items').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('menu_variants')
      .select('*')
      .eq('menu_item_id', params.id)
      .order('price', { ascending: true }),
    supabase
      .from('menu_media')
      .select('*')
      .eq('menu_item_id', params.id)
      .order('sort_order', { ascending: true }),
  ]);
  if (updatedItemError)
    return NextResponse.json(
      { message: updatedItemError.message },
      { status: 500 },
    );
  if (updatedVariantsError)
    return NextResponse.json(
      { message: updatedVariantsError.message },
      { status: 500 },
    );
  if (updatedMediaError)
    return NextResponse.json(
      { message: updatedMediaError.message },
      { status: 500 },
    );

  return NextResponse.json({
    ok: true,
    item: {
      ...(updatedItem ?? {}),
      variants: updatedVariants ?? [],
      media: updatedMedia ?? [],
    },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  const params = await context.params;
  const supabase = createServerSupabase();
  const [
    { data: existingItem, error: existingItemError },
    { data: existingMedia, error: existingMediaError },
  ] = await Promise.all([
    supabase
      .from('menu_items')
      .select('thumbnail_url')
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('menu_media').select('url').eq('menu_item_id', params.id),
  ]);
  if (existingItemError)
    return NextResponse.json(
      { message: existingItemError.message },
      { status: 500 },
    );
  if (existingMediaError)
    return NextResponse.json(
      { message: existingMediaError.message },
      { status: 500 },
    );

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', params.id);
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  const urlsToDelete: string[] = [];
  if (
    typeof existingItem?.thumbnail_url === 'string' &&
    existingItem.thumbnail_url.length > 0
  ) {
    urlsToDelete.push(existingItem.thumbnail_url);
  }
  for (const entry of existingMedia ?? []) {
    if (typeof entry.url === 'string' && entry.url.length > 0) {
      urlsToDelete.push(entry.url);
    }
  }

  await deleteStorageFiles(urlsToDelete);

  return NextResponse.json({ ok: true });
}
