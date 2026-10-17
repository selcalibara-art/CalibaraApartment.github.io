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
