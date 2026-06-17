'use client';
import StoreNav from '@/components/StoreNav';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { Camera, Lock, ShieldLock, Truck, Verified, Wallet } from '@/components/icons';

const items = [
  { icon: <Verified size={22} />, t: 'Seller KYC', d: 'Every seller is identity-verified with PAN + Aadhaar before they can list a single item.' },
  { icon: <Camera size={22} />, t: 'Authenticity checks', d: 'Listings are screened for original photos and genuine items — no stolen catalogue shots.' },
  { icon: <ShieldLock size={22} />, t: 'Escrow hold', d: 'Your money sits in Loopy Escrow, released to the seller only after you confirm delivery.' },
  { icon: <Truck size={22} />, t: 'Managed shipping', d: 'Auto-generated labels and live tracking on every order — no manual address juggling.' },
  { icon: <Lock size={22} />, t: '48h inspection', d: 'A protected window to inspect your item. Not as described? Get a full refund.' },
  { icon: <Wallet size={22} />, t: 'Instant payouts', d: 'Elite-trust sellers get instant UPI payouts the moment delivery is confirmed.' },
];

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-paper">
      <StoreNav />
      <section className="mx-auto max-w-5xl px-6 py-14 text-center">
        <Reveal>
          <span className="protect-pill"><ShieldLock size={13} /> Loopy Trust Center</span>
          <h1 className="mt-5 font-display text-[40px] font-extrabold tracking-tight text-navy">How Loopy keeps every deal safe</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">Six layers of protection sit between every buyer and seller, so a first-time buyer can pay a stranger with total confidence.</p>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <StaggerItem key={it.t}>
              <div className="card h-full p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-soft text-green-600">{it.icon}</div>
                <div className="mt-4 font-display text-[17px] font-bold text-navy">{it.t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{it.d}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </main>
  );
}
