import Link from 'next/link';
import { Loop } from '@/components/icons';

export const metadata = {
  title: 'Loopy — Terms, Privacy & Legal',
  description: 'Loopy terms of service, privacy policy and legal information.',
};

function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-[15px] font-extrabold text-navy">{n}. {title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper text-navy">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={17} /></span> Loopy
          </Link>
          <Link href="/" className="text-[14px] font-semibold text-muted hover:text-navy">← Back home</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight sm:text-[44px]">Terms, Privacy &amp; Legal</h1>
        <p className="mt-2 text-[13px] text-faint">Last updated: 23 June 2026</p>

        {/* TERMS */}
        <section className="mt-10">
          <h2 className="font-display text-[24px] font-extrabold">Terms &amp; Conditions</h2>
          <Clause n={1} title="About Loopy">Loopy is an online marketplace where sellers list products and customers buy them. Loopy connects buyers and sellers — the actual sale contract is between the customer and the seller, not with Loopy.</Clause>
          <Clause n={2} title="Who can use Loopy">You must be 18 or older to create an account and buy on your own. If you're under 18, a parent or guardian must use the account on your behalf.</Clause>
          <Clause n={3} title="Orders">Placing an order is a request to buy. The order is confirmed only once the seller accepts it and payment goes through. We may cancel an order for a pricing error, stock issue, suspected fraud, or a technical problem — you'll be notified and refunded if you already paid.</Clause>
          <Clause n={4} title="Refunds for cancelled orders">If an order is cancelled after payment, the money is refunded to your original payment method within 7 business days.</Clause>
          <Clause n={5} title="Seller payouts">Sellers get paid within 7 business days after delivery is confirmed, unless the order is still within the return window or under dispute.</Clause>
          <span id="refunds" />
          <Clause n={6} title="Returns & refunds">Customers can request a return within 48 hours of delivery. After that, the sale is final. Whether a return is accepted is the seller's decision, based on their own return policy. Loopy passes the request along but doesn't overrule the seller. If approved, refunds are processed within 7 business days.</Clause>
          <Clause n={7} title="Seller responsibilities">Sellers must list accurate product details, fair pricing, and real contact info, and are responsible for product quality and fulfilling orders on time. Loopy doesn't manufacture, inspect, or own any product listed.</Clause>
          <Clause n={8} title="Fraud & misuse">You may not commit fraud, sell fake or stolen goods, fake reviews, create duplicate accounts to dodge a ban, fake-ship orders, or misuse the refund system. If we reasonably suspect fraud, we may pause a listing or payout while we investigate. Confirmed fraud can lead to account termination and being reported to authorities.</Clause>
          <Clause n={9} title="Intellectual property">Loopy's name, logo, design, and software belong to us. You may not copy, modify, reverse-engineer, or reuse them without written permission. Sellers keep ownership of their own product photos and descriptions but allow us to display them on the platform.</Clause>
          <Clause n={10} title='"As is" — no guarantee'>Loopy is provided "as is." We don't guarantee the platform will be error-free or uninterrupted, and we're not responsible for the quality, safety, or legality of products listed by sellers.</Clause>
          <Clause n={11} title="Ending your account">We can suspend or close an account for breaking these rules, fraud, or safety reasons — usually with notice first. You can close your account anytime by contacting us, once any pending dues are settled.</Clause>
          <Clause n={12} title="Changes to these terms">We may update these terms with at least 7 days' notice for major changes. Continuing to use Loopy after that means you accept the update.</Clause>
        </section>

        {/* PRIVACY */}
        <section id="privacy" className="mt-12 scroll-mt-24">
          <h2 className="font-display text-[24px] font-extrabold">Privacy Policy</h2>
          <Clause n={1} title="What we collect">From customers: name, phone, email, delivery address, order history, and support messages. From sellers: name, contact details, and bank/UPI details for payouts. We never see or store your card number, UPI PIN, OTP, or banking password — that's handled by our payment partners.</Clause>
          <Clause n={2} title="Why we use it">To run your account, process orders and payments, pay sellers, give support, prevent fraud, and meet legal requirements. We don't sell your data to third parties for marketing.</Clause>
          <Clause n={3} title="Who we share it with">Only the seller (for your order), delivery partners, payment providers, and government authorities if legally required.</Clause>
          <Clause n={4} title="How long we keep it">Only as long as needed for the reasons above, then we delete or anonymize it.</Clause>
          <Clause n={5} title="Security">We use reasonable security measures — encryption and access controls — and only people who genuinely need it can access your data.</Clause>
          <Clause n={6} title="Your rights">You can ask for a copy of your data, ask us to correct or delete it, or withdraw consent anytime by emailing legal@loopy.in.</Clause>
          <Clause n={7} title="Children's data">We don't knowingly collect data from anyone under 18 without a parent or guardian's consent.</Clause>
          <Clause n={8} title="Cookies">We use cookies to make the site work and (with your consent) for analytics. You can turn off non-essential cookies in your browser.</Clause>
        </section>

        {/* LEGAL */}
        <section id="contact" className="mt-12 scroll-mt-24">
          <h2 className="font-display text-[24px] font-extrabold">Legal</h2>
          <Clause n={1} title="Who runs Loopy">Loopy is currently run by its three founders as a partnership — not yet a registered company. The founders are personally responsible for the business until it's incorporated. This will be updated once Loopy becomes a registered company.</Clause>
          <Clause n={2} title="Liability">Loopy isn't responsible for disputes between buyers and sellers beyond facilitating the order. Our responsibility for any single order is capped at the value of that order, except where the law doesn't allow such limits.</Clause>
          <Clause n={3} title="Force majeure">Neither side is responsible for delays caused by things genuinely out of their control — natural disasters, internet outages, government action, strikes, etc.</Clause>
          <Clause n={4} title="Complaints & disputes">Email grievance@loopy.in. We'll acknowledge within 48 hours and try to resolve within a month. If unresolved, you can approach the National Consumer Helpline or the courts.</Clause>
          <Clause n={5} title="Governing law">These terms are governed by Indian law, and any legal proceedings will be handled in the courts of Mumbai, Maharashtra.</Clause>

          <div className="mt-8 rounded-lg border border-line bg-white p-5 text-[13.5px] text-muted">
            Questions? Reach us at <span className="font-semibold text-navy">legal@loopy.in</span> · Grievances: <span className="font-semibold text-navy">grievance@loopy.in</span>
          </div>
        </section>
      </article>
    </main>
  );
}
