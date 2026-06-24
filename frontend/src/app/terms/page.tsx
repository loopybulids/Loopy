import { LegalShell, Clause } from '@/components/legal';

export const metadata = {
  title: 'Loopy — Terms & Conditions',
  description: 'Loopy terms of service.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" active="/terms">
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
    </LegalShell>
  );
}
