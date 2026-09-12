'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import { Heart } from '@/components/icons';

export default function Customers() {
  // Painted from the last visit on the first frame, then refreshed.
  const { data, loading } = useApiData('seller:customers', () =>
    api.myCustomers().then((c) => (c || []).map((x: any) => ({ ...x, email: x.email || x.phone || '—' }))),
  );
  const rows: any[] = data ?? [];


  return (
    <div>
      <PageHead title="Customers" sub="Everyone who signed up on your store — with spend and order history." />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty icon={<Heart size={24} />} title="No customers yet" hint="Shoppers appear here the moment they sign up on your storefront — even before they order." />
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
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-green-soft font-display text-[13px] font-bold text-green-600">{c.name.charAt(0).toUpperCase()}</span>
                        <span className="font-display font-bold text-navy">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{c.email}</td>
                    <td className="py-3 text-navy">{c.orders}</td>
                    <td className="py-3 font-semibold text-navy">{money(c.spent)}</td>
                    <td className="py-3 text-muted">{money(c.orders ? Math.round(c.spent / c.orders) : 0)}</td>
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
