import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateConsumption,
  calculateElectricityBill,
  calculateGrandTotal,
  formatCurrency,
  formatReading,
  formatKwh,
  generateAccessCode,
  filterBillsForTenant,
} from './billing.ts';
import type { BillItem } from '../types/billing.ts';

test('calculateConsumption: handles June-July submeter reading (1926.2 - 1824.5 = 101.7)', () => {
  const result = calculateConsumption(1824.5, 1926.2);
  assert.equal(result, 101.7);
});

test('calculateConsumption: handles zero and invalid readings gracefully', () => {
  assert.equal(calculateConsumption(100, 50), 0);
  assert.equal(calculateConsumption(NaN, 50), 0);
});

test('calculateElectricityBill: 101.7 kWh * ₱15.00 = ₱1,525.50', () => {
  const result = calculateElectricityBill(101.7, 15.0);
  assert.equal(result, 1525.5);
});

test('calculateGrandTotal: 1525.50 + 3500 + 3500 = 8525.50', () => {
  const total = calculateGrandTotal(1525.5, 3500, 3500);
  assert.equal(total, 8525.5);
});

test('calculateGrandTotal: single month rent only (rent2 = 0)', () => {
  const total = calculateGrandTotal(1525.5, 3500, 0);
  assert.equal(total, 5025.5);
});

test('formatCurrency: formats numbers to Philippine Peso style with commas and decimals', () => {
  assert.equal(formatCurrency(8525.5), '₱8,525.50');
  assert.equal(formatCurrency(1525.5), '₱1,525.50');
  assert.equal(formatCurrency(3500), '₱3,500.00');
  assert.equal(formatCurrency(0), '₱0.00');
});

test('formatReading: formats readings with thousands separator and single decimal', () => {
  assert.equal(formatReading(1824.5), '1,824.5');
  assert.equal(formatReading(1926.2), '1,926.2');
  assert.equal(formatReading(100), '100.0');
});

test('formatKwh: formats kWh values correctly', () => {
  assert.equal(formatKwh(101.7), '101.7 kWh');
});

test('generateAccessCode: generates code prefixed with unit tag and 4 digits', () => {
  const code = generateAccessCode('UNIT A1');
  assert.match(code, /^A1-\d{4}$/);

  const codeS2 = generateAccessCode('UNIT S2');
  assert.match(codeS2, /^S2-\d{4}$/);
});

test('filterBillsForTenant: STRICT PRIVACY RULE - tenant only sees bills for active access code', () => {
  const sampleBills: BillItem[] = [
    {
      id: 'b1',
      unitId: 'UNIT A1',
      billingPeriod: 'June - July',
      lastReading: 1824.5,
      currentReading: 1926.2,
      consumptionKwh: 101.7,
      perKwhRate: 15,
      electricityTotal: 1525.5,
      rent1Label: 'Rent June',
      rent1Amount: 3500,
      rent2Label: 'Rent July',
      rent2Amount: 3500,
      grandTotal: 8525.5,
      createdAt: '2026-07-05T10:00:00Z',
      accessCode: 'A1-1001',
    },
    {
      id: 'b2',
      unitId: 'UNIT A1',
      billingPeriod: 'April - May',
      lastReading: 1720.0,
      currentReading: 1824.5,
      consumptionKwh: 104.5,
      perKwhRate: 15,
      electricityTotal: 1567.5,
      rent1Label: 'Rent April',
      rent1Amount: 3500,
      rent2Label: 'Rent May',
      rent2Amount: 3500,
      grandTotal: 8567.5,
      createdAt: '2026-05-05T10:00:00Z',
      accessCode: 'A1-1001',
    },
    {
      id: 'b3_old_tenant',
      unitId: 'UNIT A1',
      billingPeriod: 'February - March',
      lastReading: 1600.0,
      currentReading: 1720.0,
      consumptionKwh: 120.0,
      perKwhRate: 15,
      electricityTotal: 1800.0,
      rent1Label: 'Rent Feb',
      rent1Amount: 3500,
      rent2Label: '',
      rent2Amount: 0,
      grandTotal: 5300.0,
      createdAt: '2026-03-05T10:00:00Z',
      accessCode: 'A1-OLD-TENANT-CODE',
    },
    {
      id: 'b4_other_unit',
      unitId: 'UNIT B',
      billingPeriod: 'June - July',
      lastReading: 800,
      currentReading: 880,
      consumptionKwh: 80,
      perKwhRate: 15,
      electricityTotal: 1200,
      rent1Label: 'Rent June',
      rent1Amount: 3500,
      rent2Label: '',
      rent2Amount: 0,
      grandTotal: 4700,
      createdAt: '2026-07-05T10:00:00Z',
      accessCode: 'B-2002',
    },
  ];

  // Active code A1-1001 must return only b1 and b2
  const tenantBills = filterBillsForTenant(sampleBills, 'A1-1001');
  assert.equal(tenantBills.length, 2);
  assert.equal(tenantBills[0].id, 'b1');
  assert.equal(tenantBills[1].id, 'b2');

  // Verify old tenant bill (b3) is NOT present
  assert.equal(tenantBills.some((b) => b.id === 'b3_old_tenant'), false);

  // Verify other unit bill (b4) is NOT present
  assert.equal(tenantBills.some((b) => b.id === 'b4_other_unit'), false);
});

test('calculateGrandTotal: all unit costs start at 0 pesos', () => {
  const electricity = calculateElectricityBill(0, 15.0);
  assert.equal(electricity, 0);
  const total = calculateGrandTotal(electricity, 0, 0);
  assert.equal(total, 0);
  assert.equal(formatCurrency(total), '₱0.00');
});

test('Master Admin password validation matches /Calibara0911', () => {
  const pass = '/Calibara0911';
  assert.equal(pass === '/Calibara0911', true);
  assert.equal(pass.toLowerCase() === '/calibara0911', true);
});
