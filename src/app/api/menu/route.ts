import { NextResponse } from 'next/server';
import { getMenuData } from '@/lib/server/menu';

export async function GET() {
  const { categories, menuItems, source } = await getMenuData();
  return NextResponse.json({ categories, menuItems, source });
}
