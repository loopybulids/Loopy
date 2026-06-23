'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Bag, Share, Plus } from '@/components/icons';

const FILTERS = ['All', 'Paid', 'Accepted', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.myOrders().then((o) => { setOrders(o || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const shown = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <PageHead title="Orders" sub="Every order in one queue." action={<Link href="/seller/orders/new" className="btn-green"><Plus size={15} /> New order</Link>} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
              filter === f ? 'bg-green text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : shown.length === 0 ? (
          <Empty
            icon={<Share size={24} />}
            title={orders.length === 0 ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            hint="Share a checkout link in a chat and paid orders will appear here automatically."
            action={<Link href="/seller/links" className="btn-green"><Plus size={15} /> Create a checkout link</Link>}
          />
        ) : (
          <div className="divide-y divide-line">
            {shown.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Bag size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14px] font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                  <div className="truncate text-[12px] text-faint">
                    {o.buyer?.name || o.customer?.name || 'Customer'} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}
                  </div>
                </div>
                <span className="text-[14px] font-bold text-navy">{money(o.total || o.amount || 0)}</span>
                <span className="chip-green ml-2">{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
