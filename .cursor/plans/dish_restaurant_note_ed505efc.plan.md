---
name: Dish Restaurant Note
overview: Mở rộng kế hoạch để thêm note nhà hàng + thời gian chuẩn bị cho món ăn, đồng thời bổ sung đặt lịch cho đơn hàng tối đa 7 ngày với rule sau 14:00 thì không cho chọn hôm nay.
todos:
  - id: add-menu-item-schema
    content: Thêm migration/seed cho menu_items.note và menu_items.preparation_time_minutes
    status: completed
  - id: update-menu-types-fallback
    content: Cập nhật MenuItem type và sample-data cho note + preparation_time_minutes
    status: completed
  - id: wire-admin-menu-fields
    content: Cập nhật form admin và API admin menu để tạo/sửa note + thời gian chuẩn bị
    status: completed
  - id: preserve-fields-on-toggle
    content: Cập nhật toggle availability để không làm mất note và preparation_time_minutes
    status: completed
  - id: highlight-note-and-prep-time
    content: Hiển thị note nổi bật và thời gian chuẩn bị trên trang chi tiết món
    status: completed
  - id: add-order-scheduling-schema
    content: Thêm cột scheduling cho orders và đồng bộ mock-db/types
    status: completed
  - id: implement-order-scheduling-ui-api
    content: Thêm options ngày đặt trước ở checkout, validate backend tối đa 7 ngày và rule sau 14:00 không cho hôm nay
    status: completed
  - id: display-schedule-info
    content: Hiển thị thông tin lịch đặt trong trang chi tiết đơn user/admin
    status: completed
  - id: verify-lints-and-flows
    content: Chạy lint và kiểm thử nhanh các luồng menu admin, menu detail, checkout, order detail
    status: completed
isProject: false
---

# Kế hoạch note, prep time, đặt trước 7 ngày

## Mục tiêu

- Thêm `note` của nhà hàng và `thời gian chuẩn bị` cho từng món.
- Hiển thị nổi bật thông tin này trong trang chi tiết món.
- Cho admin tạo/cập nhật các trường mới khi quản lý menu.
- Cho người dùng đặt lịch cho đơn trong tương lai tối đa 7 ngày.
- Áp dụng rule đã chốt: sau **14:00 (GMT+7)** thì không có option đặt hôm nay.

## Phạm vi thay đổi

- **Menu schema + seed:** thêm cột `note`, `preparation_time_minutes` cho `menu_items`.
- **Order schema:** thêm trường lịch đặt cho `orders` (đề xuất `scheduled_for timestamptz`).
- **Model + API:** mở rộng type, payload, validation cho cả menu fields và scheduling fields.
- **Admin UI:** thêm input/textarea trong form món để admin cập nhật.
- **User UI (menu detail):** hiển thị note dạng highlight + thời gian chuẩn bị.
- **Checkout + Order detail:** thêm chọn ngày đặt trước và hiển thị thông tin lịch đặt.

## Các file chính sẽ chỉnh

- Migration mới trong [supabase/migrations](supabase/migrations) cho `menu_items` và `orders`.
- Seed: [supabase/seed.sql](supabase/seed.sql).
- Types: [src/lib/types.ts](src/lib/types.ts).
- Sample fallback: [src/lib/sample-data.ts](src/lib/sample-data.ts), [src/lib/server/mock-db.ts](src/lib/server/mock-db.ts).
- Admin menu form/API:
  - [src/lib/components/admin/MenuItemForm.svelte](src/lib/components/admin/MenuItemForm.svelte)
  - [src/routes/api/admin/menu/+server.ts](src/routes/api/admin/menu/+server.ts)
  - [src/routes/api/admin/menu/[id]/+server.ts](src/routes/api/admin/menu/[id]/+server.ts)
  - [src/routes/admin/menu/+page.svelte](src/routes/admin/menu/+page.svelte)
- Menu detail UI: [src/routes/menu/[slug]/+page.svelte](src/routes/menu/[slug]/+page.svelte).
- Checkout + order API + validation:
  - [src/lib/components/OrderForm.svelte](src/lib/components/OrderForm.svelte)
  - [src/routes/cart/+page.svelte](src/routes/cart/+page.svelte)
  - [src/lib/utils/validation.ts](src/lib/utils/validation.ts)
  - [src/routes/api/orders/+server.ts](src/routes/api/orders/+server.ts)
- Order detail UI/API (user/admin):
  - [src/routes/orders/[id]/+page.svelte](src/routes/orders/[id]/+page.svelte)
  - [src/routes/admin/orders/[id]/+page.svelte](src/routes/admin/orders/[id]/+page.svelte)
  - (nếu cần mở rộng payload trả về từ API detail tương ứng)

## Cách triển khai

1. **Mở rộng dữ liệu món ăn**
  - Thêm migration `menu_items.note text` (nullable).
  - Thêm migration `menu_items.preparation_time_minutes int` (nullable, check `>= 0`).
  - Cập nhật seed + sample data + `MenuItem` type để đồng bộ cả 2 trường.
2. **Admin cập nhật note + thời gian chuẩn bị**
  - Thêm `note` (textarea) và `preparationTimeMinutes` (number input) trong form admin.
  - Chuẩn hóa dữ liệu submit (`trim() || null`, number hợp lệ hoặc null).
  - Cập nhật API `POST/PATCH /api/admin/menu` để lưu 2 trường mới.
  - Cập nhật `toggleAvailable` gửi kèm đủ field để tránh mất dữ liệu khi PATCH.
3. **Hiển thị ở trang chi tiết món**
  - Chèn block highlight “Lưu ý từ nhà hàng” ngay sau mô tả, chỉ hiện khi có `note`.
  - Hiển thị “Thời gian chuẩn bị dự kiến: X phút” (nếu có), ưu tiên nằm gần block note.
4. **Bổ sung đặt lịch đơn hàng (tối đa 7 ngày)**
  - Thêm migration cho `orders` (đề xuất `scheduled_for timestamptz`).
  - Mở rộng `OrderForm` và trang cart để có options ngày đặt:
    - Cho phép chọn từ hôm nay đến tối đa +7 ngày.
    - Sau 14:00 theo giờ Việt Nam thì loại bỏ option hôm nay.
  - Gửi `scheduledFor` lên API tạo đơn.
  - Mở rộng `orderSchema` và backend validation:
    - bắt buộc/hoặc optional theo UI;
    - không quá 7 ngày;
    - reject ngày hôm nay nếu server time (quy về Asia/Ho_Chi_Minh) > 14:00.
5. **Hiển thị lịch đặt trong chi tiết đơn**
  - Bổ sung field scheduling ở payload/order type.
  - Render thông tin ngày đặt trong trang chi tiết đơn user/admin.
6. **Kiểm tra sau triển khai**
  - Admin: tạo/sửa món với `note` + prep time; toggle trạng thái vẫn giữ dữ liệu.
  - User menu detail: note được highlight, prep time hiển thị đúng.
  - Checkout/API:
    - trước 14:00 có option hôm nay;
    - sau 14:00 không có option hôm nay;
    - không chọn được ngày > 7 ngày;
    - backend chặn payload sai rule.
  - Chạy lint cho các file vừa thay đổi và sửa lỗi phát sinh.

