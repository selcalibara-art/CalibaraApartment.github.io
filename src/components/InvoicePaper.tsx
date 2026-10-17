import React from 'react';
import type { BillItem } from '../types/billing.ts';
import { formatCurrency, formatKwh, formatReading } from '../utils/billing.ts';
import { Printer, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface InvoicePaperProps {
  bill: BillItem;
  isPastRecord?: boolean;
  onReturnToLatest?: () => void;
  layoutOrder?: 'csv' | 'grouped';
}

export const InvoicePaper: React.FC<InvoicePaperProps> = ({
  bill,
  isPastRecord = false,
  onReturnToLatest,
  layoutOrder = 'csv',
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Check if rent 2 should be displayed (non-zero and has label or amount > 0)
  const hasRent2 = bill.rent2Amount > 0 && bill.rent2Label.trim().length > 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top action toolbar (Hidden when printing) */}
      <div className="no-print w-full max-w-[540px] flex items-center justify-between mb-4 px-2">
        {isPastRecord ? (
          <button
            onClick={onReturnToLatest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#2C332B] text-white hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Latest Bill
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 text-xs text-[#2C332B]/80 font-sans-dm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            <span>Official Active Bill</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {bill.isPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              PAID {bill.paidDate ? `(${bill.paidDate})` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              UNPAID DUE
            </span>
          )}

          <button
            onClick={handlePrint}
            aria-label="Print or Save PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#2C332B] text-[#F7F5F0] hover:bg-[#1a1f1a] transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {isPastRecord && (
        <div className="no-print w-full max-w-[540px] mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs flex items-center justify-between">
          <span className="font-sans-dm">
            ⚠️ <strong>Viewing Past Bill Record</strong>: {bill.billingPeriod} (Archive Copy)
          </span>
          {onReturnToLatest && (
            <button
              onClick={onReturnToLatest}
              className="underline font-semibold hover:text-amber-950 ml-2"
            >
              Return to Current
            </button>
          )}
        </div>
      )}

      {/* THE OFFICIAL INVOICE PAPER (MATCHES ATTACHED IMAGE EXACTLY) */}
      <div
        className="print-area w-full max-w-[540px] bg-[#F7F5F0] text-[#2C332B] p-7 md:p-9 rounded-sm border border-[#DFDDD4] paper-shadow relative select-text"
        id="invoice-document"
      >
        {/* TOP APARTMENT LINE-ART SVG ICON */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg
              className="w-10 h-10 stroke-[#2C332B] fill-none"
              viewBox="0 0 48 48"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Roof & Main structure */}
              <path d="M6 42V18L24 6l18 12v24H6z" />
              {/* Horizontal floor separators */}
              <path d="M6 24h36" />
              <path d="M6 32h36" />
              {/* Center Door */}
              <path d="M20 42v-8h8v8" />
              {/* Windows Floor 2 */}
              <rect x="11" y="27" width="5" height="3" />
              <rect x="32" y="27" width="5" height="3" />
              {/* Windows Floor 3 */}
              <rect x="11" y="19" width="5" height="3" />
              <rect x="21.5" y="19" width="5" height="3" />
              <rect x="32" y="19" width="5" height="3" />
              {/* Attic / Crest circle */}
              <circle cx="24" cy="12" r="2.5" />
            </svg>
          </div>
        </div>

        {/* BRAND HEADER & ADDRESS */}
        <div className="text-center">
          <h1 className="font-serif-cormorant text-2xl md:text-3xl font-bold tracking-[0.22em] uppercase text-[#2C332B]">
            CALIBARA APARTMENT
          </h1>
          <p className="font-sans-dm text-[11px] md:text-xs tracking-[0.18em] font-medium text-[#2C332B]/85 mt-1.5 uppercase">
            ADDRESS: BATAS, SILANG, CAVITE
          </p>
        </div>

        {/* THIN HORIZONTAL DIVIDER */}
        <div className="w-full h-[1px] bg-[#2C332B]/70 my-5"></div>

        {/* INVOICE TITLE & PERIOD */}
        <div className="text-center mb-4">
          <h2 className="font-serif-cormorant text-3xl md:text-4xl font-normal tracking-[0.25em] text-[#2C332B] uppercase">
            INVOICE
          </h2>

          <div className="flex items-center justify-center gap-2 mt-1.5">
            {/* Left botanical leaf SVG */}
            <svg
              className="w-4 h-4 fill-[#4A5D43] opacity-80"
              viewBox="0 0 24 24"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>

            <span className="font-script-caveat text-xl md:text-2xl text-[#2C332B] font-semibold tracking-wide">
              {bill.billingPeriod}
            </span>

            {/* Right botanical leaf SVG (mirrored) */}
            <svg
              className="w-4 h-4 fill-[#4A5D43] opacity-80 -scale-x-100"
              viewBox="0 0 24 24"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>

          {/* UNIT BADGE */}
          <div className="mt-3 flex justify-center">
            <span className="inline-block bg-[#2C332B] text-[#F7F5F0] font-sans-dm text-xs font-semibold tracking-[0.2em] px-4 py-1 rounded-full uppercase">
              {bill.unitId}
            </span>
          </div>
        </div>

        {/* TABLE: EXACT MATCH OF THE ATTACHED IMAGE */}
        <div className="w-full mt-4 border border-[#2C332B]/20 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {/* Table Header: Dark Charcoal fill with white uppercase text */}
          <div className="grid grid-cols-12 bg-[#2C332B] text-white font-sans-dm text-xs font-bold tracking-[0.14em] uppercase py-2.5 px-4 border-b border-[#2C332B]">
            <div className="col-span-8 text-left">DESCRIPTION</div>
            <div className="col-span-4 text-right">AMOUNT</div>
          </div>

          {/* Table Rows Body */}
          <div className="divide-y divide-[#2C332B]/15 font-sans-dm text-xs md:text-[13px] text-[#2C332B]">
            {/* Row 1: Last Electricity Submeter Reading */}
            <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
              <div className="col-span-8 font-medium">Last Electricity Submeter Reading</div>
              <div className="col-span-4 text-right font-medium text-[#2C332B]">
                {formatReading(bill.lastReading)}
              </div>
            </div>

            {/* Row 2: Current Reading */}
            <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
              <div className="col-span-8 font-medium">Current Reading</div>
              <div className="col-span-4 text-right font-medium text-[#2C332B]">
                {formatReading(bill.currentReading)}
              </div>
            </div>

            {/* Row 3: Total Consumption */}
            <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
              <div className="col-span-8 font-medium">Total Consumption</div>
              <div className="col-span-4 text-right font-semibold text-[#2C332B]">
                {formatKwh(bill.consumptionKwh)}
              </div>
            </div>

            {/* Row 4: Per kWh */}
            <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
              <div className="col-span-8 font-medium">Per kWh</div>
              <div className="col-span-4 text-right font-medium text-[#2C332B]">
                {formatCurrency(bill.perKwhRate)}
              </div>
            </div>

            {/* If layoutOrder === 'grouped': show Total Electricity Bill subtotal first, then Rent */}
            {layoutOrder === 'grouped' && (
              <div className="grid grid-cols-12 bg-[#DFDDD4] py-2.5 px-4 items-center font-semibold text-[#2C332B] border-t border-b border-[#2C332B]/20">
                <div className="col-span-8 uppercase tracking-wide">Total Electricity Bill</div>
                <div className="col-span-4 text-right font-bold text-sm">
                  {formatCurrency(bill.electricityTotal)}
                </div>
              </div>
            )}

            {/* Row 5: Rent Row 1 */}
            <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
              <div className="col-span-8 font-medium">{bill.rent1Label || 'Rent'}</div>
              <div className="col-span-4 text-right font-medium text-[#2C332B]">
                {formatCurrency(bill.rent1Amount)}
              </div>
            </div>

            {/* Row 6: Rent Row 2 (auto-hidden if 0) */}
            {hasRent2 && (
              <div className="grid grid-cols-12 bg-[#EFECE6] py-2 px-4 items-center">
                <div className="col-span-8 font-medium">{bill.rent2Label}</div>
                <div className="col-span-4 text-right font-medium text-[#2C332B]">
                  {formatCurrency(bill.rent2Amount)}
                </div>
              </div>
            )}

            {/* If layoutOrder === 'csv' (The image order): Total Electricity Bill here */}
            {layoutOrder === 'csv' && (
              <div className="grid grid-cols-12 bg-[#DFDDD4] py-2.5 px-4 items-center font-semibold text-[#2C332B] border-t border-b border-[#2C332B]/20">
                <div className="col-span-8">Total Electricity Bill</div>
                <div className="col-span-4 text-right font-bold text-sm">
                  {formatCurrency(bill.electricityTotal)}
                </div>
              </div>
            )}

            {/* Grand Total Row: TOTAL AMOUNT DUE in #CCC8B8 */}
            <div className="grid grid-cols-12 bg-[#CCC8B8] py-3.5 px-4 items-center font-sans-dm text-[#2C332B] border-t-2 border-[#2C332B]">
              <div className="col-span-7 font-bold text-sm md:text-base tracking-[0.12em] uppercase">
                TOTAL AMOUNT DUE
              </div>
              <div className="col-span-5 text-right font-bold text-base md:text-xl tracking-tight text-[#2C332B]">
                {formatCurrency(bill.grandTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Optional landlord memo/notes */}
        {bill.notes && (
          <div className="mt-4 px-3 py-1.5 bg-[#EFECE6]/60 rounded text-[11px] text-[#2C332B]/80 font-sans-dm italic text-center">
            {bill.notes}
          </div>
        )}

        {/* FOOTER: MATCHES ATTACHED IMAGE EXACTLY */}
        <div className="w-full h-[1px] bg-[#2C332B]/60 my-6"></div>

        <div className="text-center">
          <p className="font-script-caveat text-xl md:text-2xl text-[#2C332B] font-semibold tracking-wide">
            Thank you for your prompt payment.
          </p>
          <div className="my-2 flex justify-center text-[#2C332B] text-base leading-none select-none">
            ♥
          </div>
          <p className="font-serif-cormorant text-xs md:text-sm tracking-[0.28em] uppercase text-[#2C332B]/90 font-semibold mt-1">
            CALIBARA APARTMENT
          </p>
        </div>
      </div>
    </div>
  );
};
