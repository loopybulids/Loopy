import { LegalShell, Clause } from '@/components/legal';

export const metadata = {
  title: 'Loopy — Legal',
  description: 'Loopy legal information.',
};

export default function LegalPage() {
  return (
    <LegalShell title="Legal" active="/legal">
      <Clause n={1} title="Who runs Loopy">Loopy is currently run by its three founders as a partnership — not yet a registered company. The founders are personally responsible for the business until it's incorporated. This will be updated once Loopy becomes a registered company.</Clause>
      <Clause n={2} title="Liability">Loopy isn't responsible for disputes between buyers and sellers beyond facilitating the order. Our responsibility for any single order is capped at the value of that order, except where the law doesn't allow such limits.</Clause>
      <Clause n={3} title="Force majeure">Neither side is responsible for delays caused by things genuinely out of their control — natural disasters, internet outages, government action, strikes, etc.</Clause>
      <Clause n={4} title="Complaints & disputes">Email grievance@loopy.in. We'll acknowledge within 48 hours and try to resolve within a month. If unresolved, you can approach the National Consumer Helpline or the courts.</Clause>
      <Clause n={5} title="Governing law">These terms are governed by Indian law, and any legal proceedings will be handled in the courts of Mumbai, Maharashtra.</Clause>

      <div id="contact" className="mt-8 scroll-mt-24 rounded-lg border border-line bg-white p-5 text-[13.5px] text-muted">
        Questions? Reach us at <span className="font-semibold text-navy">legal@loopy.in</span> · Grievances: <span className="font-semibold text-navy">grievance@loopy.in</span>
      </div>
    </LegalShell>
  );
}
