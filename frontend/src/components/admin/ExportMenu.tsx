'use client';
import { api } from '@/lib/api';
import ExportSheet, { ExportItem } from '@/components/ExportSheet';
import { AdminRange } from '@/lib/admin-range';

export type ExportDataset = 'orders' | 'summary' | 'payouts' | 'sellers';

/**
 * Download the platform's data as CSV.
 *
 * Opens on whatever period the page's picker is showing, and can be pointed at
 * any other period — presets or exact dates — without moving the screen
 * underneath. Files are built on the server (AdminService.exportData) so they
 * are complete rather than whatever page of rows a table is holding.
 */

const ITEMS: Record<ExportDataset, ExportItem> = {
  orders: { id: 'orders', title: 'Orders', hint: 'Every order placed — buyer, seller, amounts, status and tracking' },
  summary: { id: 'summary', title: 'Daily summary', hint: 'One row per day (per month for long ranges), with a total' },
  payouts: { id: 'payouts', title: 'Payouts', hint: 'Withdrawal requests, decisions and transfer references' },
  sellers: { id: 'sellers', title: 'Sellers', hint: 'Each seller’s orders, GMV and fees for the period' },
};

export default function ExportMenu({
  range,
  datasets = ['orders', 'summary', 'payouts', 'sellers'],
}: {
  range: AdminRange;
  datasets?: ExportDataset[];
}) {
  return (
    <ExportSheet
      theme="admin"
      items={datasets.map((d) => ITEMS[d])}
      initialRange={range}
      download={(id, query) => api.adminExport(id, query)}
    />
  );
}
