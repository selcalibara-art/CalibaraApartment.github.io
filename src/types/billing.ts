export interface PaymentProof {
  id: string;
  method: string;
  referenceNumber: string;
  amountPaid: number;
  paidDate: string;
  receiptImageUrl?: string; // Base64 data URL of uploaded screenshot
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface PaymentSettings {
  qrCodeImageUrl?: string; // Landlord's uploaded QR code image
  qrTitle?: string;
  instructions?: string;
  updatedAt?: string;
}

export interface BillItem {
  id: string;
  unitId: string; // e.g. 'UNIT A1', 'UNIT B'
  billingPeriod: string; // e.g. 'Bill for June - July'
  lastReading: number; // e.g. 0.0
  currentReading: number; // e.g. 0.0
  consumptionKwh: number; // e.g. 0.0
  perKwhRate: number; // e.g. 15.00
  electricityTotal: number; // e.g. 0.0
  rent1Label: string; // e.g. 'Monthly Rent'
  rent1Amount: number; // e.g. 0.0
  rent2Label: string; // e.g. 'Rent July'
  rent2Amount: number; // e.g. 0.0
  grandTotal: number; // e.g. 0.0
  createdAt: string; // ISO date string
  accessCode: string; // The access code at time of publishing (for tenant privacy)
  isPaid?: boolean;
  paidDate?: string;
  notes?: string;
  paymentProof?: PaymentProof;
}

export interface Unit {
  id: string; // 'UNIT A1', 'UNIT B', etc.
  name: string; // 'UNIT A1'
  floor: string;
  tenantName: string;
  activeAccessCode: string;
  standardMonthlyRent: number;
}

export type AppMode = 'tenant' | 'admin';
