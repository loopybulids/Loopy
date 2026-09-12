'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { custApi, getCust } from '@/lib/customer';
import AccountShell from '@/components/store/AccountShell';
import { Check, Plus, Truck } from '@/components/icons';

const BLANK = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function AddressesPage() {
  const { username } = useParams<{ username: string }>();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addr, setAddr] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof typeof addr, v: string) => setAddr((a) => ({ ...a, [k]: v }));

  const load = () => {
    if (!getCust(username)) { setLoading(false); return; }
    custApi.addresses(username)
      .then((a: any[]) => setList(a || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); window.addEventListener('cust-change', load); return () => window.removeEventListener('cust-change', load); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setErr('');
    for (const f of ['name', 'phone', 'line1', 'city', 'pincode'] as const) {
      if (!addr[f].trim()) return setErr('Please fill in name, phone, address, city and pincode.');
    }
    setBusy(true);
    try {
      const created = await custApi.addAddress(username, addr);
      setList((l) => [...l, created]);
      setAddr(BLANK);
      setAdding(false);
    } catch (e: any) {
      setErr(e?.message || 'Could not save that address.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountShell username={username} title="Delivery addresses">
      {loading ? (
        <p className="py-8 text-center text-[13px] text-faint">Loading your addresses…</p>
      ) : (
        <>
          {list.length === 0 && !adding ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-soft text-green-600"><Truck size={24} /></span>
              <p className="mt-3 font-display text-[16px] font-bold text-navy">No saved addresses</p>
              <p className="mt-1 text-[13px] text-muted">Add one now and it&apos;ll be ready at checkout.</p>
              <button onClick={() => setAdding(true)} className="btn-green mt-4 inline-flex"><Plus size={15} /> Add an address</button>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((a) => (
                <div key={a.id} className="rounded-xl border border-line bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[14px] font-bold text-navy">{a.name}</span>
                        {a.isDefault && <span className="chip-green">Default</span>}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                        {a.city} - {a.pincode}{a.state ? `, ${a.state}` : ''}
                      </p>
                      <p className="mt-1 text-[12.5px] text-faint">{a.phone}</p>
                    </div>
                  </div>
                </div>
              ))}

              {!adding && (
                <button onClick={() => setAdding(true)} className="btn-ghost w-full justify-center">
                  <Plus size={15} /> Add another address
                </button>
              )}
            </div>
          )}

          {adding && (
            <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <h3 className="font-display text-[15px] font-bold text-navy">New address</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input className="c-input" placeholder="Full name" value={addr.name} onChange={(e) => set('name', e.target.value)} />
                <input className="c-input" placeholder="Phone" value={addr.phone} onChange={(e) => set('phone', e.target.value)} />
                <input className="c-input col-span-2" placeholder="Address line 1" value={addr.line1} onChange={(e) => set('line1', e.target.value)} />
                <input className="c-input col-span-2" placeholder="Address line 2" value={addr.line2} onChange={(e) => set('line2', e.target.value)} />
                <input className="c-input" placeholder="City" value={addr.city} onChange={(e) => set('city', e.target.value)} />
                <input className="c-input" placeholder="Pincode" value={addr.pincode} onChange={(e) => set('pincode', e.target.value)} />
                <input className="c-input col-span-2" placeholder="State" value={addr.state} onChange={(e) => set('state', e.target.value)} />
              </div>

              {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

              <div className="mt-4 flex gap-2">
                <button onClick={save} disabled={busy} className="btn-green disabled:opacity-60">
                  {busy ? 'Saving…' : <><Check size={15} /> Save address</>}
                </button>
                <button onClick={() => { setAdding(false); setErr(''); setAddr(BLANK); }} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </AccountShell>
  );
}
