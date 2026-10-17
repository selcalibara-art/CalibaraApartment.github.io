import React from 'react';
import type { BillItem } from '../types/billing.ts';
import { formatCurrency, formatKwh, formatReading } from '../utils/billing.ts';
import { ShieldCheck, Eye, History, FileText, CheckCircle2, Clock } from 'lucide-react';

interface SubmeterHistoryProps {
  bills: BillItem[];
  currentBillId?: string;
  onSelectBill: (bill: BillItem) => void;
}

export const SubmeterHistory: React.FC<SubmeterHistoryProps> = ({
  bills,
  currentBillId,
  onSelectBill,
}) => {
  if (!bills || bills.length === 0) {
    return null;
  }

  // Check continuity between consecutive bills
  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="w-full max-w-[540px] mt-8 bg-[#F7F5F0] border border-[#DFDDD4] rounded-sm p-5 md:p-6 paper-shadow">
      <div className="flex items-center justify-between pb-3 border-b border-[#2C332B]/15">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#2C332B]" />
          <h3 className="font-serif-cormorant text-lg md:text-xl font-bold uppercase tracking-[0.14em] text-[#2C332B]">
            Previous Bills & Submeter History
          </h3>
        </div>
        <span className="text-[11px] font-sans-dm font-semibold text-[#2C332B]/70 bg-[#DFDDD4] px-2 py-0.5 rounded">
          {bills.length} {bills.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {/* Transparency Guarantee Callout */}
      <div className="my-3.5 p-3 bg-[#EFECE6] border-l-3 border-[#2C332B] rounded-r text-xs text-[#2C332B] font-sans-dm flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#2C332B] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Submeter Audit & Reading Continuity:</span>{' '}
          Verify that your current bill's <em>Last Reading</em> strictly matches your previous bill's <em>Current Reading</em>, ensuring 100% fair, transparent meter accounting.
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto border border-[#2C332B]/20 rounded mt-3">
        <table className="w-full text-left font-sans-dm text-xs">
          <thead>
            <tr className="bg-[#2C332B] text-white uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Billing Period</th>
              <th className="py-2.5 px-2 text-right">Last</th>
              <th className="py-2.5 px-2 text-right">Current</th>
              <th className="py-2.5 px-2 text-right">kWh</th>
              <th className="py-2.5 px-3 text-right">Total Due</th>
              <th className="py-2.5 px-2 text-center">Status</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C332B]/10">
            {sortedBills.map((b, index) => {
              const isSelected = b.id === currentBillId;
              const nextOlderBill = sortedBills[index + 1];
              // Continuity check: Does this bill's lastReading match older bill's currentReading?
              const isContinuityMatch =
                nextOlderBill && Math.abs(b.lastReading - nextOlderBill.currentReading) < 0.05;

              return (
                <tr
                  key={b.id}
                  onClick={() => onSelectBill(b)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#CCC8B8]/50 font-semibold'
                      : index % 2 === 0
                      ? 'bg-[#EFECE6]/70 hover:bg-[#DFDDD4]/60'
                      : 'bg-[#F7F5F0] hover:bg-[#DFDDD4]/60'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-[#2C332B]">{b.billingPeriod}</div>
                    <div className="text-[10px] text-[#2C332B]/60">
                      {new Date(b.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#2C332B]/85">
                    {formatReading(b.lastReading)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#2C332B] font-medium">
                    {formatReading(b.currentReading)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-[#2C332B] font-medium">
                    {formatKwh(b.consumptionKwh)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#2C332B]">
                    {formatCurrency(b.grandTotal)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {b.isPaid ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        Due
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBill(b);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#2C332B] text-white hover:bg-black transition-colors"
                      title="Load this invoice"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#2C332B]/75 font-sans-dm">
        <span>Click any row to load that invoice into the official receipt preview.</span>
      </div>
    </div>
  );
};
