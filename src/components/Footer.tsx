import { Facebook, MessageCircleMore, Music2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30 pb-20 pt-10 md:pb-10">
      <div className="container-shell grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Tiệm Lẩu Anh Hai"
              className="size-10 rounded-md object-contain"
            />
            <div>
              <p className="text-sm text-muted-foreground">Tiệm Lẩu</p>
              <p className="font-semibold">Anh Hai</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Hương vị miền Tây, đậm đà tại nhà.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Thông tin quán</p>
          <p>Địa chỉ: Cập nhật sau</p>
          <p>Giờ mở cửa: 10:00 - 22:00</p>
          <p>Hotline: 0900 000 000</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Kết nối</p>
          <div className="flex gap-4">
            <Button asChild variant="ghost" size="icon">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Facebook />
              </a>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Zalo"
              >
                <MessageCircleMore />
              </a>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                <Music2 />
              </a>
            </Button>
          </div>
        </div>
      </div>
      <p className="container-shell mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tiệm Lẩu Anh Hai.
      </p>
    </footer>
  );
}
