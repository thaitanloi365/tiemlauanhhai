const MENU_IMAGE = '/logo.png';

const lauCategoryId = '00000000-0000-0000-0000-000000000001';
const toppingCategoryId = '00000000-0000-0000-0000-000000000002';
const drinkCategoryId = '00000000-0000-0000-0000-000000000003';

export const sampleCategories: AppTypes.Category[] = [
  { id: lauCategoryId, name: 'Lẩu', slug: 'lau', sort_order: 1 },
  { id: toppingCategoryId, name: 'Gọi Thêm', slug: 'topping', sort_order: 2 },
  { id: drinkCategoryId, name: 'Đồ Uống', slug: 'do-uong', sort_order: 3 },
];

const toppingList: Array<[string, number]> = [
  ['Bắp bò', 80000],
  ['Bò mềm', 70000],
  ['Cá hú', 70000],
  ['Tôm', 50000],
  ['Mực', 50000],
  ['Rau lẩu mắm', 30000],
  ['Rau lẩu chả cá', 30000],
  ['Bún', 10000],
  ['Mì gói', 3000],
];

const drinkList: Array<[string, number]> = [
  ['Nước dừa tươi', 25000],
  ['Trà đá', 5000],
  ['Nước suối', 10000],
];

export const sampleMenuItems: AppTypes.MenuItem[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    category_id: lauCategoryId,
    name: 'Lẩu Mắm',
    slug: 'lau-mam',
    description: 'Thanh vị nguyên bản với nước lẩu mắm đậm đà.',
    ingredients:
      'Cá hú tươi, thịt ba chỉ xào sả ớt, cà tím, rau đắng, rau muống, bắp chuối bào và bông súng.',
    note: 'Nước lẩu được nấu sẵn theo mẻ, vui lòng đợi thêm nếu quán đang đông khách.',
    preparation_time_minutes: 35,
    thumbnail_url: MENU_IMAGE,
    is_available: true,
    is_topping: false,
    is_main_dish: true,
    block_today: false,
    block_today_reason: null,
    blocked_delivery_dates: [],
    blocked_delivery_date_reasons: {},
    sort_order: 1,
    media: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        menu_item_id: '10000000-0000-0000-0000-000000000001',
        type: 'image',
        url: MENU_IMAGE,
        alt_text: 'Lẩu mắm Tiệm Lẩu Anh Hai',
        sort_order: 1,
      },
    ],
    variants: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        menu_item_id: '10000000-0000-0000-0000-000000000001',
        name: 'Lẩu 1-2 người ăn',
        price: 200000,
        serves_min: 1,
        serves_max: 2,
        is_default: true,
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        menu_item_id: '10000000-0000-0000-0000-000000000001',
        name: 'Lẩu 3-4 người ăn',
        price: 300000,
        serves_min: 3,
        serves_max: 4,
        is_default: false,
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    category_id: lauCategoryId,
    name: 'Lẩu Chả Cá Thác Lác Khổ Qua',
    slug: 'lau-cha-ca-thac-lac-kho-qua',
    description: 'Vị ngọt thanh từ xương hầm, nấm rơm và chả cá nhà làm.',
    ingredients: 'Chả cá thác lác, khổ qua, nấm rơm, xương hầm.',
    note: 'Khổ qua được sơ chế tươi trong ngày.',
    preparation_time_minutes: 30,
    thumbnail_url: MENU_IMAGE,
    is_available: true,
    is_topping: false,
    is_main_dish: true,
    block_today: false,
    block_today_reason: null,
    blocked_delivery_dates: [],
    blocked_delivery_date_reasons: {},
    sort_order: 2,
    media: [
      {
        id: '20000000-0000-0000-0000-000000000002',
        menu_item_id: '10000000-0000-0000-0000-000000000002',
        type: 'image',
        url: MENU_IMAGE,
        alt_text: 'Lẩu chả cá thác lác khổ qua',
        sort_order: 1,
      },
    ],
    variants: [
      {
        id: '30000000-0000-0000-0000-000000000003',
        menu_item_id: '10000000-0000-0000-0000-000000000002',
        name: 'Lẩu 2-3 người ăn',
        price: 180000,
        serves_min: 2,
        serves_max: 3,
        is_default: true,
      },
    ],
  },
  ...toppingList.map(([name, price], index) => ({
    id: `10000000-0000-0000-0000-0000000010${String(index).padStart(2, '0')}`,
    category_id: toppingCategoryId,
    name,
    slug: name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    description: null,
    ingredients: null,
    note: null,
    preparation_time_minutes: null,
    thumbnail_url: MENU_IMAGE,
    is_available: true,
    is_topping: true,
    is_main_dish: false,
    block_today: false,
    block_today_reason: null,
    blocked_delivery_dates: [],
    blocked_delivery_date_reasons: {},
    sort_order: index + 1,
    media: [],
    variants: [
      {
        id: `30000000-0000-0000-0000-0000000090${String(index).padStart(2, '0')}`,
        menu_item_id: `10000000-0000-0000-0000-0000000010${String(index).padStart(2, '0')}`,
        name: 'Phần thường',
        price: Number(price),
        serves_min: null,
        serves_max: null,
        is_default: true,
      },
    ],
  })),
  ...drinkList.map(([name, price], index) => ({
    id: `10000000-0000-0000-0000-0000000020${String(index).padStart(2, '0')}`,
    category_id: drinkCategoryId,
    name,
    slug: name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    description: null,
    ingredients: null,
    note: null,
    preparation_time_minutes: null,
    thumbnail_url: MENU_IMAGE,
    is_available: true,
    is_topping: false,
    is_main_dish: false,
    block_today: false,
    block_today_reason: null,
    blocked_delivery_dates: [],
    blocked_delivery_date_reasons: {},
    sort_order: index + 1,
    media: [],
    variants: [
      {
        id: `30000000-0000-0000-0000-0000000080${String(index).padStart(2, '0')}`,
        menu_item_id: `10000000-0000-0000-0000-0000000020${String(index).padStart(2, '0')}`,
        name: 'Ly',
        price: Number(price),
        serves_min: null,
        serves_max: null,
        is_default: true,
      },
    ],
  })),
];
