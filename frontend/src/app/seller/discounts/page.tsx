'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty } from '@/components/seller-ui';
import { Plus, Tag, Check } from '@/components/icons';

const BLANK = { id: '', code: '', type: 'percent', value: '10', minOrder: '0', days: '', hours: '' };

function remaining(expiresAt: string | null): { label: string; expired: boolean; none: boolean } {
  if (!expiresAt) return { label: 'No expiry', expired: false, none: true };
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: 'Expired', expired: true, none: false };
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return { label: `Expires in ${d > 0 ? `${d}d ` : ''}${h}h`, expired: false, none: false };
}

export default function Discounts() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const editing = !!f.id;

  const load = () => api.myCoupons().then((c) => setCoupons(c || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setErr('');
    if (!f.code.trim()) return setErr('Enter a coupon code.');
    setBusy(true);
    const body = { code: f.code, type: f.type, value: Number(f.value) || 0, minOrder: Number(f.minOrder) || 0, days: Number(f.days) || 0, hours: Number(f.hours) || 0 };
    try {
      if (editing) await api.updateCoupon(f.id, body); else await api.createCoupon(body);
      setF({ ...BLANK }); setSaved(true); setTimeout(() => setSaved(false), 1500); await load();
    } catch (e: any) { setErr(e?.message || 'Could not save coupon.'); } finally { setBusy(false); }
  };

  const edit = (c: any) => {
    const ms = c.expiresAt ? new Date(c.expiresAt).getTime() - Date.now() : 0;
    const days = ms > 0 ? Math.floor(ms / 86400000) : 0;
    const hours = ms > 0 ? Math.floor((ms % 86400000) / 3600000) : 0;
    setF({ id: c.id, code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder), days: days ? String(days) : '', hours: hours ? String(hours) : '' });
  };

  const remove = async (id: string) => { if (!confirm('Delete this coupon?')) return; await api.deleteCoupon(id); if (f.id === id) setF({ ...BLANK }); load(); };

  return (
    <div>
      <PageHead title="Discounts" sub="Create coupon codes to share alongside your checkout links." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title={editing ? 'Edit coupon' : 'New coupon'}>
          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Code</label>
          <input value={f.code} onChange={(e) => set('code', e.target.value)} placeholder="SUMMER20" className="c-input mt-1.5 uppercase" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Type</label>
              <select value={f.type} onChange={(e) => set('type', e.target.value)} className="c-input mt-1.5">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed ₹</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Value</label>
              <input type="number" value={f.value} onChange={(e) => set('value', e.target.value)} className="c-input mt-1.5" />
            </div>
          </div>

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Minimum order (₹)</label>
          <input type="number" value={f.minOrder} onChange={(e) => set('minOrder', e.target.value)} className="c-input mt-1.5" />

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Available for</label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><input type="number" min={0} value={f.days} onChange={(e) => set('days', e.target.value)} placeholder="0" className="c-input" /><span className="text-[13px] text-muted">days</span></div>
            <div className="flex items-center gap-2"><input type="number" min={0} value={f.hours} onChange={(e) => set('hours', e.target.value)} placeholder="0" className="c-input" /><span className="text-[13px] text-muted">hours</span></div>
          </div>
          <p className="mt-1 text-[11px] text-faint">Leave both at 0 for a coupon that never expires.</p>

          {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}
          <div className="mt-5 flex gap-2">
            <button onClick={submit} disabled={busy} className="btn-green flex-1 justify-center disabled:opacity-60">{busy ? 'Saving…' : saved ? <><Check size={15} /> Saved</> : editing ? 'Save changes' : <><Plus size={15} /> Create coupon</>}</button>
            {editing && <button onClick={() => setF({ ...BLANK })} className="btn-ghost px-4">Cancel</button>}
          </div>
        </Panel>

        <Panel title="Your coupons">
          {coupons.length === 0 ? (
            <Empty icon={<Tag size={24} />} title="No coupons yet" hint="Create a coupon code to share with customers alongside your checkout links." />
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => {
                const r = remaining(c.expiresAt);
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Tag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[15px] font-extrabold tracking-wide text-navy">{c.code}</div>
                      <div className="text-[12px] text-faint">
                        {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}{c.minOrder ? ` · min ₹${c.minOrder}` : ''} · <span className={r.expired ? 'text-rose' : r.none ? '' : 'text-navy/70'}>{r.label}</span>
                      </div>
                    </div>
                    <span className={r.expired ? 'chip-rose' : 'chip-green'}>{r.expired ? 'Expired' : 'Active'}</span>
                    <button onClick={() => edit(c)} className="text-[12px] font-bold text-green-600 hover:underline">Edit</button>
                    <button onClick={() => remove(c.id)} className="text-[12px] font-bold text-rose hover:underline">Delete</button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
