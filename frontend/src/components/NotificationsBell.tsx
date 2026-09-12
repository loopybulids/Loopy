'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bell } from '@/components/icons';

export default function NotificationsBell() {
  const [data, setData] = useState<{ items: any[]; unread: number }>({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => api.myNotifications().then(setData).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => { clearInterval(t); document.removeEventListener('mousedown', onDoc); };
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && data.unread > 0) { await api.readNotifications().catch(() => {}); setData((d) => ({ ...d, unread: 0 })); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white">
        <Bell size={18} />
        {data.unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-bold text-white">{data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          <div className="border-b border-line px-4 py-3 font-display text-[14px] font-bold text-navy">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-faint">No notifications yet.</p>
            ) : data.items.map((n) => (
              <Link key={n.id} href={n.link || '#'} onClick={() => setOpen(false)} className={`block border-b border-line px-4 py-3 hover:bg-paper ${!n.read ? 'bg-green-soft/30' : ''}`}>
                <div className="flex items-center justify-between"><span className="text-[13px] font-bold text-navy">{n.title}</span><span className="text-[10px] text-faint">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
                {n.body && <p className="mt-0.5 text-[12px] text-muted">{n.body}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
