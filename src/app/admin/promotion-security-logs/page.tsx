'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateTimeVi } from '@/lib/date';

type PromotionSecurityLog = {
  id: string;
  event_type: string;
  promotion_code: string | null;
  ip_address: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const EVENT_OPTIONS = [
  { value: 'all', label: 'Tất cả sự kiện' },
  { value: 'promotion_validate_failed', label: 'Validate failed' },
  { value: 'promotion_validate_rate_limited', label: 'Validate rate limited' },
  { value: 'promotion_consume_failed', label: 'Consume failed' },
  { value: 'promotion_release_failed', label: 'Release failed' },
];

export default function PromotionSecurityLogsPage() {
  const [logs, setLogs] = useState<PromotionSecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [eventType, setEventType] = useState('all');
  const [query, setQuery] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams();
      if (eventType !== 'all') params.set('eventType', eventType);
      if (query.trim()) params.set('q', query.trim());
      const search = params.toString();
      const res = await fetch(
        `/api/admin/promotions/security-logs${search ? `?${search}` : ''}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message ?? 'Không tải được security logs.');
        return;
      }
      setLogs((data.logs ?? []) as PromotionSecurityLog[]);
    } catch {
      setMessage('Không thể kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [eventType, query]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="container-shell space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Promotion Security Logs</h1>
        <Button type="button" variant="outline" onClick={loadLogs}>
          Refresh
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          >
            {EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo code / IP / reason..."
          />
        </div>
      </section>

      {message ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          Chưa có log nào.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Thời gian</th>
                <th className="px-3 py-2 font-medium">Sự kiện</th>
                <th className="px-3 py-2 font-medium">Mã KM</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Lý do</th>
                <th className="px-3 py-2 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateTimeVi(log.created_at)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{log.event_type}</td>
                  <td className="px-3 py-2">{log.promotion_code ?? '-'}</td>
                  <td className="px-3 py-2">{log.ip_address ?? '-'}</td>
                  <td className="px-3 py-2">{log.reason ?? '-'}</td>
                  <td className="px-3 py-2">
                    <pre className="max-w-[360px] overflow-auto whitespace-pre-wrap text-xs">
                      {JSON.stringify(log.metadata ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
