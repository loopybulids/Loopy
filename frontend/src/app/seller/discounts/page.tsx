'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty } from '@/components/seller-ui';
import { Plus, Tag, Check } from '@/components/icons';

const BLANK = { id: '', code: '', type: 'percent', value: '', maxDiscount: '', minOrder: '', usageLimit: '', perCustomerLimit: '', startsAt: '', expiresAt: '', active: true };
type Form = typeof BLANK;

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

/** Rupees with Indian digit grouping — ₹1,500 rather than ₹1500. */
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function statusOf(c: any): { label: string; cls: string } {
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= Date.now()) return { label: 'Expired', cls: 'chip-rose' };
  if (c.startsAt && new Date(c.startsAt).getTime() > Date.now()) return { label: 'Scheduled', cls: 'chip-amber' };
  if (!c.active) return { label: 'Inactive', cls: 'chip-navy' };
  return { label: 'Active', cls: 'chip-green' };
}

/** Column header — one place for the header row's type treatment. */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-3 text-[10.5px] font-bold uppercase tracking-[0.09em] text-faint ${className}`}>
      {children}
    </th>
  );
}

export default function Discounts() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>({ ...BLANK });
  const [copied, setCopied] = useState('');

  const load = () => api.myCoupons().then((c) => setCoupons(c || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const newCoupon = () => { setF({ ...BLANK }); setOpen(true); };
  const edit = (c: any) => {
    setF({ id: c.id, code: c.code, type: c.type, value: String(c.value), maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '', minOrder: c.minOrder ? String(c.minOrder) : '', usageLimit: c.usageLimit != null ? String(c.usageLimit) : '', perCustomerLimit: c.perCustomerLimit != null ? String(c.perCustomerLimit) : '', startsAt: toLocalInput(c.startsAt), expiresAt: toLocalInput(c.expiresAt), active: c.active });
    setOpen(true);
  };
  const remove = async (id: string) => { if (!confirm('Delete this coupon?')) return; await api.deleteCoupon(id); load(); };
  const toggleActive = async (c: any) => { setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))); try { await api.updateCoupon(c.id, { active: !c.active }); } catch { load(); } };
  const copy = (code: string) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1200); };

  return (
    <div>
      <PageHead title="Discounts" sub="Create discount codes for your customers." action={<button onClick={newCoupon} className="btn-green"><Plus size={15} /> New Coupon</button>} />

      {coupons.length === 0 ? (
        <Panel><Empty icon={<Tag size={24} />} title="No coupons yet" hint="Create a discount code to share with your customers." action={<button onClick={newCoupon} className="btn-green"><Plus size={15} /> New Coupon</button>} /></Panel>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-fixed text-left">
              {/* Fixed widths so the columns don't reflow as values change
                  length — the money and date columns were colliding. */}
              <colgroup>
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[110px]" />
                <col className="w-[90px]" />
                <col className="w-[175px]" />
                <col className="w-[105px]" />
                <col className="w-[80px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line bg-paper/40">
                  <Th className="pl-5 pr-3">Code</Th>
                  <Th className="px-3">Discount</Th>
                  <Th className="px-3 text-right">Min order</Th>
                  <Th className="px-3 text-right">Uses</Th>
                  <Th className="px-3">Validity</Th>
                  <Th className="px-3">Status</Th>
                  <Th className="px-3 text-center">Active</Th>
                  <Th className="pl-3 pr-5 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coupons.map((c) => {
                  const st = statusOf(c);
                  const off = !c.active || st.label === 'Expired';

                  return (
                    <tr key={c.id} className={`transition-colors hover:bg-paper/50 ${off ? 'opacity-65' : ''}`}>
                      {/* code */}
                      <td className="py-4 pl-5 pr-3">
                        <button
                          onClick={() => copy(c.code)}
                          title="Copy code"
                          className="group inline-flex items-center gap-2 rounded-lg bg-paper px-2.5 py-1.5"
                        >
                          <span className="font-mono text-[12.5px] font-bold tracking-[0.06em] text-navy">{c.code}</span>
                          {copied === c.code
                            ? <Check size={13} className="text-green-600" />
                            : <span className="text-faint transition-colors group-hover:text-navy"><ICopy /></span>}
                        </button>
                      </td>

                      {/* discount */}
                      <td className="px-3 py-4">
                        <span className="font-display text-[15px] font-bold tabular-nums text-navy">
                          {c.type === 'percent' ? `${c.value}%` : inr(c.value)}
                        </span>
                        {c.type === 'percent' && c.maxDiscount != null && (
                          <span className="ml-1.5 text-[11.5px] text-faint">max {inr(c.maxDiscount)}</span>
                        )}
                      </td>

                      {/* min order */}
                      <td className="px-3 py-4 text-right text-[13px] tabular-nums text-muted">
                        {c.minOrder ? inr(c.minOrder) : <span className="text-faint">—</span>}
                      </td>

                      {/* uses */}
                      <td className="px-3 py-4 text-right text-[13px] tabular-nums text-muted">
                        <span className="font-semibold text-navy">{c.usedCount ?? 0}</span>
                        <span className="text-faint"> / {c.usageLimit ?? '\u221E'}</span>
                      </td>

                      {/* validity */}
                      <td className="px-3 py-4">
                        <div className="text-[12px] leading-[1.5] text-muted">
                          <div>{c.startsAt ? fmt(c.startsAt) : 'Live now'}</div>
                          <div className="text-faint">
                            <span className="mr-1">{'\u2192'}</span>
                            {c.expiresAt ? fmt(c.expiresAt) : 'No expiry'}
                          </div>
                        </div>
                      </td>

                      {/* status */}
                      <td className="px-3 py-4"><span className={st.cls}>{st.label}</span></td>

                      {/* active */}
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={() => toggleActive(c)}
                          aria-pressed={c.active}
                          title={c.active ? 'Turn off' : 'Turn on'}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.active ? 'bg-green' : 'bg-line'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-card transition-transform ${c.active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </button>
                      </td>

                      {/* actions */}
                      <td className="py-4 pl-3 pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => edit(c)} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-navy"><IPencil /></button>
                          <button onClick={() => remove(c.id)} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-rose-soft hover:text-rose"><ITrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && <CouponModal f={f} setF={setF} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function CouponModal({ f, setF, onClose, onSaved }: { f: Form; setF: (u: Form) => void; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof Form, v: any) => setF({ ...f, [k]: v });
  const editing = !!f.id;

  const submit = async () => {
    setErr('');
    if (!f.code.trim()) return setErr('Enter a coupon code.');
    if (!f.value) return setErr(f.type === 'percent' ? 'Enter a percentage.' : 'Enter an amount.');
    setBusy(true);
    const body: any = {
      code: f.code, type: f.type, value: Number(f.value) || 0,
      maxDiscount: f.type === 'percent' && f.maxDiscount ? Number(f.maxDiscount) : null,
      minOrder: f.minOrder ? Number(f.minOrder) : 0,
      usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
      perCustomerLimit: f.perCustomerLimit ? Number(f.perCustomerLimit) : null,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
      active: f.active,
    };
    try { if (editing) await api.updateCoupon(f.id, body); else await api.createCoupon(body); onSaved(); }
    catch (e: any) { setErr(e?.message || 'Could not save.'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-slideRight relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold text-navy">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
          <button onClick={onClose} className="text-muted hover:text-navy">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <L>Coupon Code *</L>
            <input value={f.code} maxLength={20} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="E.G. SAVE10" className="c-input mt-1.5 uppercase" />
            <p className="mt-1 text-[11px] text-faint">Alphanumeric, max 20 characters</p>
          </div>

          <div>
            <L>Discount Type</L>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([['percent', '% Percentage'], ['fixed', '$ Fixed Amount']] as const).map(([k, label]) => (
                <button key={k} onClick={() => set('type', k)} className={`rounded-xl border py-2.5 text-[13px] font-bold transition ${f.type === k ? 'border-green bg-green-soft text-green' : 'border-line text-muted hover:border-green/40'}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <L>{f.type === 'percent' ? 'Percentage (%) *' : 'Amount (₹) *'}</L>
              <input type="number" min={0} value={f.value} onChange={(e) => set('value', e.target.value)} placeholder={f.type === 'percent' ? 'e.g. 10' : 'e.g. 100'} className="c-input mt-1.5" />
            </div>
            {f.type === 'percent' && (
              <div>
                <L>Max Discount (₹)</L>
                <input type="number" min={0} value={f.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} placeholder="No cap" className="c-input mt-1.5" />
              </div>
            )}
          </div>

          <div>
            <L>Minimum Order Amount (₹)</L>
            <input type="number" min={0} value={f.minOrder} onChange={(e) => set('minOrder', e.target.value)} placeholder="No minimum" className="c-input mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><L>Total Usage Limit</L><input type="number" min={0} value={f.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" className="c-input mt-1.5" /></div>
            <div><L>Per Customer Limit</L><input type="number" min={0} value={f.perCustomerLimit} onChange={(e) => set('perCustomerLimit', e.target.value)} placeholder="Unlimited" className="c-input mt-1.5" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><L>Starts At</L><input type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} className="c-input mt-1.5" /></div>
            <div><L>Expires At</L><input type="datetime-local" value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className="c-input mt-1.5" /></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-navy">Active</span>
            <button onClick={() => set('active', !f.active)} className={`relative h-6 w-11 rounded-full transition-colors ${f.active ? 'bg-green' : 'bg-line'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${f.active ? 'left-[22px]' : 'left-0.5'}`} /></button>
          </div>

          {err && <p className="text-[13px] font-semibold text-rose">{err}</p>}
          <button onClick={submit} disabled={busy} className="btn-green w-full justify-center disabled:opacity-60">{busy ? 'Saving…' : editing ? 'Save changes' : <><Plus size={15} /> Create Coupon</>}</button>
        </div>
      </div>
    </div>
  );
}

const L = ({ children }: { children: React.ReactNode }) => <label className="block text-[13px] font-bold text-navy">{children}</label>;
const ICopy = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
const IPencil = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
const ITrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>;
