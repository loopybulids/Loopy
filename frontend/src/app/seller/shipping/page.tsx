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
  const [fee, setFee] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => api.myOrders().then((o) => { setOrders(o || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    load();
    api.myProfile().then((p) => { setFee(p?.shippingFee != null ? String(p.shippingFee) : ''); setAddress(p?.address || ''); }).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSaving(true); setSaved(false);
    try { await api.updateProfile({ shippingFee: fee === '' ? 0 : Number(fee), address }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const ship = async (id: string) => {
    setBusyId(id);
    try { await api.shipOrder(id); await load(); } catch { /* ignore */ } finally { setBusyId(''); }
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

      <Panel className="mt-6" title="Shipping settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Flat shipping fee (₹)</label>
            <input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0 for free shipping" className="c-input mt-1.5" />
            <p className="mt-1 text-[11px] text-faint">Charged to customers per order. Set 0 for free shipping.</p>
          </div>
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">Pickup address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Where couriers pick up your parcels" className="c-input mt-1.5" />
          </div>
        </div>
        <button onClick={saveSettings} disabled={saving} className="btn-green mt-4 disabled:opacity-60">{saving ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save shipping settings'}</button>
      </Panel>

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
