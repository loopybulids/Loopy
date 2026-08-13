'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, StatCard, Panel, Empty, money } from '@/components/seller-ui';
import { Truck, Check } from '@/components/icons';

const STATUS_CHIP: Record<string, string> = {
  Paid: 'chip-amber',
  Accepted: 'chip-navy',
  Shipped: 'chip-green',
  Delivered: 'chip-green',
};

export default function Shipping() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [s, setSData] = useState({ shippingFee: '', minOrderAmount: '', shipDays: '', address: '', freeShipEnabled: false, freeShipThreshold: '', expressShip: false, expressFee: '' });
  const setS = (k: keyof typeof s, v: any) => setSData((p) => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => api.myOrders().then((o) => { setOrders(o || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    load();
    api.myProfile().then((p) => {
      if (!p) return;
      setSData({
        shippingFee: p.shippingFee != null ? String(p.shippingFee) : '',
        minOrderAmount: p.minOrderAmount != null ? String(p.minOrderAmount) : '',
        shipDays: p.shipDays != null ? String(p.shipDays) : '',
        address: p.address || '',
        freeShipEnabled: !!p.freeShipEnabled,
        freeShipThreshold: p.freeShipThreshold != null ? String(p.freeShipThreshold) : '',
        expressShip: !!p.expressShip,
        expressFee: p.expressFee != null ? String(p.expressFee) : '',
      });
    }).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.updateProfile({
        shippingFee: s.shippingFee === '' ? 0 : Number(s.shippingFee),
        minOrderAmount: s.minOrderAmount === '' ? 0 : Number(s.minOrderAmount),
        shipDays: s.shipDays === '' ? 0 : Number(s.shipDays),
        address: s.address,
        freeShipEnabled: s.freeShipEnabled,
        freeShipThreshold: s.freeShipThreshold === '' ? 0 : Number(s.freeShipThreshold),
        expressShip: s.expressShip,
        expressFee: s.expressFee === '' ? 0 : Number(s.expressFee),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const ship = async (id: string) => {
    // Courier is required by the API — ask before shipping.
    const courier = window.prompt('Shipping agency / courier name');
    if (!courier?.trim()) return;
    setBusyId(id);
    try { await api.shipOrder(id, courier.trim()); await load(); } catch { /* ignore */ } finally { setBusyId(''); }
  };

  const toShip = orders.filter((o) => o.status === 'Paid' || o.status === 'Accepted');
  const inTransit = orders.filter((o) => o.status === 'Shipped').length;
  const delivered = orders.filter((o) => o.status === 'Delivered' || o.status === 'Completed').length;

  return (
    <div>
      <PageHead title="Shipping" sub="Generate labels, mark shipments, and keep customers updated." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders to ship" value={toShip.length} icon={<Truck size={18} />} accent />
        <StatCard label="In transit" value={inTransit} />
        <StatCard label="Delivered" value={delivered} />
      </div>

      <div className="mt-6 max-w-xl">
        <Panel title="Shipping settings">
          <div className="space-y-5">
            <SField label="Flat shipping charge per order (₹)" hint="Charged on every order unless the free-shipping threshold below is met.">
              <input type="number" min={0} value={s.shippingFee} onChange={(e) => setS('shippingFee', e.target.value)} placeholder="0" className="c-input mt-1.5" />
            </SField>
            <SField label="Minimum order amount (₹)" hint="Buyers can't check out unless their cart subtotal reaches this amount. Set to 0 to disable.">
              <input type="number" min={0} value={s.minOrderAmount} onChange={(e) => setS('minOrderAmount', e.target.value)} placeholder="0" className="c-input mt-1.5" />
            </SField>
            <SField label="Days to ship" hint="Estimated number of days you take to dispatch an order. Shown to buyers on product pages.">
              <input type="number" min={0} value={s.shipDays} onChange={(e) => setS('shipDays', e.target.value)} placeholder="0" className="c-input mt-1.5" />
            </SField>
            <SField label="Pickup address" hint="Where couriers collect your parcels.">
              <textarea value={s.address} onChange={(e) => setS('address', e.target.value)} rows={2} placeholder="Building, street, city, pincode" className="c-input mt-1.5" />
            </SField>

            <div className="border-t border-line pt-4">
              <SToggle label="Offer free shipping above a threshold" sub="Optional. When enabled, orders above the amount below ship for free." on={s.freeShipEnabled} set={(v) => setS('freeShipEnabled', v)} />
              {s.freeShipEnabled && <input type="number" min={0} value={s.freeShipThreshold} onChange={(e) => setS('freeShipThreshold', e.target.value)} placeholder="Free shipping above ₹…" className="c-input mt-3" />}
            </div>

            <div className="border-t border-line pt-4">
              <SToggle label="Enable Express Shipping" sub="When enabled, buyers can choose express shipping at checkout for a premium fee." on={s.expressShip} set={(v) => setS('expressShip', v)} />
              {s.expressShip && <input type="number" min={0} value={s.expressFee} onChange={(e) => setS('expressFee', e.target.value)} placeholder="Express fee (₹)" className="c-input mt-3" />}
            </div>

            <button onClick={saveSettings} disabled={saving} className="btn-green disabled:opacity-60">{saving ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save shipping settings'}</button>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Fulfillment queue">
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : toShip.length === 0 ? (
          <Empty icon={<Truck size={24} />} title="Nothing to ship" hint="Paid orders waiting for fulfillment will appear here with one-click label generation." />
        ) : (
          <div className="divide-y divide-line">
            {toShip.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-soft text-green-600"><Truck size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14px] font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                  <div className="truncate text-[12px] text-faint">{o.buyer?.name || o.customer?.name || 'Customer'} · {money(o.total || o.amount || 0)}</div>
                </div>
                <span className={STATUS_CHIP[o.status] || 'chip-navy'}>{o.status}</span>
                <button onClick={() => ship(o.id)} disabled={busyId === o.id} className="btn-green ml-2 px-3 py-2 text-[12.5px] disabled:opacity-50">
                  {busyId === o.id ? 'Shipping…' : 'Mark shipped'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <p className="mt-4 text-center text-[12px] text-faint">Courier integrations (Shiprocket · Delhivery · Blue Dart) connect in Settings.</p>
    </div>
  );
}

function SField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[14px] font-bold text-navy">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function SToggle({ label, sub, on, set }: { label: string; sub: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div><div className="text-[14px] font-bold text-navy">{label}</div><p className="mt-0.5 text-[12px] text-muted">{sub}</p></div>
      <button onClick={() => set(!on)} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-green' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
