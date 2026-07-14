'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty } from '@/components/seller-ui';
import { Plus, Tag, Check } from '@/components/icons';

const BLANK = { id: '', code: '', type: 'percent', value: '10', minOrder: '0', expiresAt: '' };

// ISO → "YYYY-MM-DDTHH:mm" (local) for a datetime-local input
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function expiryInfo(expiresAt: string | null): { label: string; expired: boolean; none: boolean } {
  if (!expiresAt) return { label: 'No expiry', expired: false, none: true };
  const expired = new Date(expiresAt).getTime() <= Date.now();
  const label = `${expired ? 'Expired' : 'Valid until'} ${new Date(expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  return { label, expired, none: false };
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
    const body = { code: f.code, type: f.type, value: Number(f.value) || 0, minOrder: Number(f.minOrder) || 0, expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null };
    try {
      if (editing) await api.updateCoupon(f.id, body); else await api.createCoupon(body);
      setF({ ...BLANK }); setSaved(true); setTimeout(() => setSaved(false), 1500); await load();
    } catch (e: any) { setErr(e?.message || 'Could not save coupon.'); } finally { setBusy(false); }
  };

  const edit = (c: any) => {
    setF({ id: c.id, code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder), expiresAt: toLocalInput(c.expiresAt) });
  };

  const remove = async (id: string) => { if (!confirm('Delete this coupon?')) return; await api.deleteCoupon(id); if (f.id === id) setF({ ...BLANK }); load(); };
  const toggleActive = async (c: any) => { setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))); try { await api.updateCoupon(c.id, { active: !c.active }); } catch { load(); } };

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

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Expires on</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input type="datetime-local" value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className="c-input" />
            {f.expiresAt && <button onClick={() => set('expiresAt', '')} className="text-[12px] font-semibold text-rose hover:underline">Clear</button>}
          </div>
          <p className="mt-1 text-[11px] text-faint">Pick a date &amp; time. Leave empty for a coupon that never expires.</p>

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
                const r = expiryInfo(c.expiresAt);
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Tag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[15px] font-extrabold tracking-wide text-navy">{c.code}</div>
                      <div className="text-[12px] text-faint">
                        {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}{c.minOrder ? ` · min ₹${c.minOrder}` : ''} · <span className={r.expired ? 'text-rose' : r.none ? '' : 'text-navy/70'}>{r.label}</span>
                      </div>
                    </div>
                    <span className={r.expired ? 'chip-rose' : !c.active ? 'chip-navy' : 'chip-green'}>{r.expired ? 'Expired' : !c.active ? 'Inactive' : 'Active'}</span>
                    <button onClick={() => toggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${c.active ? 'bg-green' : 'bg-line'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${c.active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
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
