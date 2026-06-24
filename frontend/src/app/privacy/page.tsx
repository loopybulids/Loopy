import { LegalShell, Clause } from '@/components/legal';

export const metadata = {
  title: 'Loopy — Privacy Policy',
  description: 'How Loopy collects and uses your data.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" active="/privacy">
      <Clause n={1} title="What we collect">From customers: name, phone, email, delivery address, order history, and support messages. From sellers: name, contact details, and bank/UPI details for payouts. We never see or store your card number, UPI PIN, OTP, or banking password — that's handled by our payment partners.</Clause>
      <Clause n={2} title="Why we use it">To run your account, process orders and payments, pay sellers, give support, prevent fraud, and meet legal requirements. We don't sell your data to third parties for marketing.</Clause>
      <Clause n={3} title="Who we share it with">Only the seller (for your order), delivery partners, payment providers, and government authorities if legally required.</Clause>
      <Clause n={4} title="How long we keep it">Only as long as needed for the reasons above, then we delete or anonymize it.</Clause>
      <Clause n={5} title="Security">We use reasonable security measures — encryption and access controls — and only people who genuinely need it can access your data.</Clause>
      <Clause n={6} title="Your rights">You can ask for a copy of your data, ask us to correct or delete it, or withdraw consent anytime by emailing legal@loopy.in.</Clause>
      <Clause n={7} title="Children's data">We don't knowingly collect data from anyone under 18 without a parent or guardian's consent.</Clause>
      <Clause n={8} title="Cookies">We use cookies to make the site work and (with your consent) for analytics. You can turn off non-essential cookies in your browser.</Clause>
    </LegalShell>
  );
}
