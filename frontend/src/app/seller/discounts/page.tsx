'use client';
import { useState } from 'react';
import { PageHead, Panel } from '@/components/seller-ui';
import { Plus, Tag } from '@/components/icons';

type Coupon = { code: string; type: 'percent' | 'fixed'; value: number; minOrder: number };

export default function Discounts() {
  const [coupons, setCoupons] = useState<Coupon[]>([
    { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 0 },
    { code: 'FLAT100', type: 'fixed', value: 100, minOrder: 999 },
  ]);
  const [form, setForm] = useState<Coupon>({ code: '', type: 'percent', value: 10, minOrder: 0 });

  const add = () => {
    if (!form.code.trim()) return;
    setCoupons((c) => [{ ...form, code: form.code.toUpperCase() }, ...c]);
    setForm({ code: '', type: 'percent', value: 10, minOrder: 0 });
  };

  return (
    <div>
      <PageHead title="Discounts" sub="Create coupon codes to share alongside your checkout links." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="New coupon">
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Code</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="SUMMER20"
            className="c-input mt-1.5 uppercase" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Coupon['type'] }))} className="c-input mt-1.5">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed ₹</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Value</label>
              <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} className="c-input mt-1.5" />
            </div>
          </div>

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Minimum order (₹)</label>
          <input type="number" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))} className="c-input mt-1.5" />

          <button onClick={add} className="btn-green mt-5 w-full justify-center"><Plus size={15} /> Create coupon</button>
        </Panel>

        <Panel title="Active coupons">
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.code} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Tag size={16} /></span>
                <div className="flex-1">
                  <div className="font-display text-[15px] font-extrabold tracking-wide text-navy">{c.code}</div>
                  <div className="text-[12px] text-faint">
                    {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}{c.minOrder ? ` · min ₹${c.minOrder}` : ''}
                  </div>
                </div>
                <span className="chip-green">Active</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
