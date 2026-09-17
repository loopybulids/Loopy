'use client';
import { api } from '@/lib/api';
import ExportSheet, { ExportItem } from '@/components/ExportSheet';

/**
 * Download your own data as a spreadsheet.
 *
 * The period lives in this menu rather than on the page, because the dashboard
 * itself is not filtered by date — a picker up in the header would imply the
 * figures below it had changed. Here it only ever means "what goes in the
 * file", which is the one question being asked.
 *
 * Files are built on the server (sellers.service exportData), so an export is
 * the seller's whole history for the period rather than the page of rows the
 * screen happens to be holding.
 */

const ITEMS: ExportItem[] = [
  { id: 'orders', title: 'Orders', hint: 'Each order — customer, items, what you receive, tracking' },
  { id: 'summary', title: 'Day-by-day summary', hint: 'One row per day (per month for long periods), with a total' },
  { id: 'payouts', title: 'Payouts', hint: 'Your withdrawals, their status and references' },
  { id: 'products', title: 'Products', hint: 'Your catalogue with stock, and units sold in the period' },
];

export default function SellerExport() {
  return <ExportSheet theme="seller" items={ITEMS} download={(id, query) => api.myExport(id, query)} />;
}
