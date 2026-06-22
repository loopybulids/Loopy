'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Heart } from '@/components/icons';

export default function Customers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myOrders().then((orders) => {
      const map = new Map<string, any>();
      for (const o of orders || []) {
        const c = o.buyer || o.customer || {};
        const key = c.id || c.name || 'guest';
        const prev = map.get(key) || { name: c.name || 'Customer', email: c.email || c.phone || '—', orders: 0, spent: 0 };
        prev.orders += 1;
        prev.spent += o.total || o.amount || 0;
        map.set(key, prev);
      }
      setRows(Array.from(map.values()).sort((a, b) => b.spent - a.spent));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHead title="Customers" sub="Everyone who's bought from you — with spend and order history." />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty icon={<Heart size={24} />} title="No customers yet" hint="Your buyers will appear here after their first order, with lifetime spend and average order value." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-faint">
                  <th className="pb-3 font-bold">Customer</th>
                  <th className="pb-3 font-bold">Contact</th>
                  <th className="pb-3 font-bold">Orders</th>
                  <th className="pb-3 font-bold">Total spent</th>
                  <th className="pb-3 font-bold">Avg order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-green-soft font-display text-[13px] font-extrabold text-green-600">{c.name.charAt(0).toUpperCase()}</span>
                        <span className="font-display font-bold text-navy">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{c.email}</td>
                    <td className="py-3 text-navy">{c.orders}</td>
                    <td className="py-3 font-semibold text-navy">{money(c.spent)}</td>
                    <td className="py-3 text-muted">{money(Math.round(c.spent / c.orders))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
