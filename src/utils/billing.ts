import type { BillItem } from '../types/billing.ts';

/**
 * Calculates consumption in kWh: Current Reading - Last Reading.
 * Ensures non-negative result and prevents floating point rounding issues.
 */
export function calculateConsumption(lastReading: number, currentReading: number): number {
  const diff = currentReading - lastReading;
  if (isNaN(diff) || diff < 0) return 0;
  return Math.round(diff * 10) / 10;
}

/**
 * Calculates electricity subtotal: Total Consumption * Rate per kWh.
 * Rounded to 2 decimal places.
 */
export function calculateElectricityBill(consumption: number, perKwhRate: number): number {
  if (isNaN(consumption) || isNaN(perKwhRate) || consumption < 0 || perKwhRate < 0) return 0;
  const raw = consumption * perKwhRate;
  return Math.round(raw * 100) / 100;
}

/**
 * Calculates grand total amount due: Electricity subtotal + Rent 1 + Rent 2.
 */
export function calculateGrandTotal(electricityTotal: number, rent1: number, rent2: number = 0): number {
  const r1 = isNaN(rent1) || rent1 < 0 ? 0 : rent1;
  const r2 = isNaN(rent2) || rent2 < 0 ? 0 : rent2;
  const elec = isNaN(electricityTotal) || electricityTotal < 0 ? 0 : electricityTotal;
  return Math.round((elec + r1 + r2) * 100) / 100;
}

/**
 * Formats a currency amount into standard Philippine Peso display, e.g. "₱1,525.50".
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₱0.00';
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₱${intPart}.${parts[1]}`;
}

/**
 * Formats a meter reading with thousands separators, e.g. "1,824.5".
 */
export function formatReading(reading: number): string {
  if (isNaN(reading)) return '0.0';
  const parts = reading.toFixed(1).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intPart}.${parts[1]}`;
}

/**
 * Formats kWh consumption, e.g. "101.7 kWh".
 */
export function formatKwh(consumption: number): string {
  if (isNaN(consumption)) return '0.0 kWh';
  return `${formatReading(consumption)} kWh`;
}

/**
 * Generates a clean, unique access code for a unit, e.g. "A1-8492" or "S1-3914".
 */
export function generateAccessCode(unitId: string): string {
  const cleanPrefix = unitId.replace(/^UNIT\s*/i, '').trim().toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}-${randomNum}`;
}

/**
 * PRIVACY RULE FILTER:
 * Returns ONLY the bills matching the tenant's current active access code.
 * Bills from previous tenants or other codes for the same unit are completely hidden.
 */
export function filterBillsForTenant(bills: BillItem[], activeAccessCode: string): BillItem[] {
  if (!activeAccessCode || !activeAccessCode.trim()) return [];
  const normalizedCode = activeAccessCode.trim().toUpperCase();
  return bills
    .filter((b) => b.accessCode.trim().toUpperCase() === normalizedCode)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Returns the most recent bill from a list of bills.
 */
export function getLatestBill(bills: BillItem[]): BillItem | undefined {
  if (!bills || bills.length === 0) return undefined;
  return [...bills].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

/**
 * Compact payload representation for sharing bills via URL (Messenger, SMS, etc.)
 */
export interface CompactBillPayload {
  i: string;
  u: string;
  p: string;
  l: number;
  c: number;
  k: number;
  r: number;
  e: number;
  r1l: string;
  r1a: number;
  r2l?: string;
  r2a?: number;
  t: number;
  a: string;
  d?: string;
  n?: string;
  pd?: boolean;
}

/**
 * Encodes a bill into a shareable link that tenants can tap on Messenger / WhatsApp / SMS
 * to immediately view the exact numbers on their phone and auto-save it to their browser.
 */
export function generateBillShareUrl(bill: BillItem, baseUrl?: string): string {
  const base =
    baseUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : 'https://selcalibara-art.github.io/CalibaraApartment.github.io/');

  const compact: CompactBillPayload = {
    i: bill.id,
    u: bill.unitId,
    p: bill.billingPeriod,
    l: bill.lastReading,
    c: bill.currentReading,
    k: bill.consumptionKwh,
    r: bill.perKwhRate,
    e: bill.electricityTotal,
    r1l: bill.rent1Label,
    r1a: bill.rent1Amount,
    r2l: bill.rent2Label || undefined,
    r2a: bill.rent2Amount || undefined,
    t: bill.grandTotal,
    a: bill.accessCode,
    d: bill.createdAt,
    n: bill.notes || undefined,
    pd: bill.isPaid || undefined,
  };

  const jsonStr = JSON.stringify(compact);
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
  const cleanBase = base.split('?')[0].split('#')[0];
  return `${cleanBase}?code=${encodeURIComponent(bill.accessCode)}&billData=${encoded}`;
}

/**
 * Decodes a bill from URL parameters when a tenant opens a shared link in Messenger or browser.
 */
export function parseBillFromUrl(searchString: string): BillItem | null {
  try {
    const params = new URLSearchParams(searchString);
    const billData = params.get('billData');
    if (!billData) return null;

    const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(billData))));
    const compact: CompactBillPayload = JSON.parse(jsonStr);
    if (!compact || !compact.u || !compact.a) return null;

    return {
      id: compact.i || `bill-${compact.u}-${Date.now()}`,
      unitId: compact.u,
      billingPeriod: compact.p || 'Current Billing Period',
      lastReading: Number(compact.l) || 0,
      currentReading: Number(compact.c) || 0,
      consumptionKwh: Number(compact.k) || 0,
      perKwhRate: Number(compact.r) || 15,
      electricityTotal: Number(compact.e) || 0,
      rent1Label: compact.r1l || 'Monthly Rent',
      rent1Amount: Number(compact.r1a) || 0,
      rent2Label: compact.r2l || '',
      rent2Amount: Number(compact.r2a) || 0,
      grandTotal: Number(compact.t) || 0,
      createdAt: compact.d || new Date().toISOString(),
      accessCode: compact.a,
      notes: compact.n || '',
      isPaid: Boolean(compact.pd),
    };
  } catch (err) {
    console.warn('Failed to parse bill from URL:', err);
    return null;
  }
}
