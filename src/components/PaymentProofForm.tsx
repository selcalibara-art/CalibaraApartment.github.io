import React, { useState } from 'react';
import type { BillItem, PaymentProof, PaymentSettings } from '../types/billing.ts';
import { formatCurrency } from '../utils/billing.ts';
import {
  QrCode,
  UploadCloud,
  CheckCircle2,
  Clock,
  FileImage,
  AlertCircle,
  Eye,
  X,
  ZoomIn,
} from 'lucide-react';

interface PaymentProofFormProps {
  bill: BillItem;
  paymentSettings?: PaymentSettings;
  onSubmitProof: (proof: PaymentProof) => void;
}

export const PaymentProofForm: React.FC<PaymentProofFormProps> = ({
  bill,
  paymentSettings,
  onSubmitProof,
}) => {
  const [method, setMethod] = useState<string>('QR Code Scan (GCash / Bank)');
  const [refNumber, setRefNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(bill.grandTotal);
  const [paidDate, setPaidDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(
    bill.paymentProof?.receiptImageUrl || null
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle image upload and convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setScreenshotData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim() && method !== 'Cash On-Site') {
      setErrorMsg('Please enter the transaction reference number.');
      return;
    }
    if (!screenshotData && method !== 'Cash On-Site') {
      setErrorMsg('Please upload a screenshot of your payment receipt.');
      return;
    }

    const proof: PaymentProof = {
      id: `proof-${Date.now()}`,
      method,
      referenceNumber: refNumber.trim() || 'CASH-PAYMENT',
      amountPaid: Number(amountPaid) || 0,
      paidDate,
      receiptImageUrl: screenshotData || undefined,
      notes: notes.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    onSubmitProof(proof);
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  const existingProof = bill.paymentProof;

  return (
    <div className="no-print w-full max-w-[540px] mt-6 bg-[#F7F5F0] border border-[#DFDDD4] rounded-sm p-5 md:p-6 paper-shadow">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#2C332B]/15">
        <QrCode className="w-5 h-5 text-[#2C332B]" />
        <div>
          <h3 className="font-serif-cormorant text-lg md:text-xl font-bold uppercase tracking-[0.14em] text-[#2C332B]">
            Scan QR Code &amp; Submit Payment Receipt
          </h3>
          <p className="text-[11px] text-[#2C332B]/75 font-sans-dm">
            Scan the landlord&apos;s payment QR code below, then upload your screenshot for verification.
          </p>
        </div>
      </div>

      {/* WHERE TO SEND MONEY: LANDLORD UPLOADED QR CODE SECTION */}
      <div className="mt-4">
        {paymentSettings?.qrCodeImageUrl ? (
          <div className="p-4 bg-[#EFECE6] border border-[#2C332B]/20 rounded-sm flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2C332B] mb-1 font-sans-dm">
              {paymentSettings.qrTitle || 'Official Payment QR Code'}
            </span>
            <p className="text-[11px] text-[#2C332B]/75 max-w-sm mb-3 font-sans-dm">
              {paymentSettings.instructions ||
                'Scan this QR code using GCash, Maya, or your banking app. Once transferred, please submit your payment screenshot below.'}
            </p>

            {/* Clickable QR Code with Zoom indicator */}
            <div
              onClick={() => setQrModalOpen(true)}
              className="group relative cursor-pointer p-2 bg-white rounded border border-[#2C332B]/30 shadow-xs hover:shadow-md transition-shadow"
              title="Click to view full size"
            >
              <img
                src={paymentSettings.qrCodeImageUrl}
                alt="Payment QR Code"
                className="w-48 h-48 md:w-56 md:h-56 object-contain rounded"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-[#2C332B] font-bold rounded shadow-xs">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Click to Enlarge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="mt-2 text-[11px] text-[#2C332B]/80 hover:text-black font-semibold underline inline-flex items-center gap-1"
            >
              <ZoomIn className="w-3 h-3" /> View Large QR Code
            </button>
          </div>
        ) : (
          /* Placeholder when landlord hasn't uploaded a QR code yet */
          <div className="p-4 bg-[#EFECE6] border border-dashed border-[#2C332B]/30 rounded text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#DFDDD4] flex items-center justify-center mb-2">
              <QrCode className="w-5 h-5 text-[#2C332B]/70" />
            </div>
            <div className="text-xs font-bold text-[#2C332B] uppercase tracking-wider">
              Landlord Payment QR Code
            </div>
            <p className="text-[11px] text-[#2C332B]/75 mt-1 max-w-sm mx-auto">
              The landlord can upload or update the payment QR code screenshot anytime from the Landlord Admin Panel.
            </p>
            <div className="mt-2 text-[10px] text-[#2C332B]/60 italic">
              Cash on-site is also accepted at Batas, Silang, Cavite.
            </div>
          </div>
        )}
      </div>

      {/* SUBMITTED PROOF STATUS BANNER */}
      {existingProof && (
        <div className="mt-5 p-3.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs font-sans-dm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-amber-950">
              <Clock className="w-4 h-4 text-amber-600" />
              {existingProof.status === 'verified'
                ? 'Payment Verified & Confirmed by Landlord'
                : 'Payment Proof Submitted (Pending Landlord Review)'}
            </span>
            <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-mono">
              Ref: {existingProof.referenceNumber}
            </span>
          </div>
          <div className="text-[11px] text-amber-900/90 flex items-center justify-between">
            <span>
              Channel: <strong>{existingProof.method}</strong> • Amount: <strong>{formatCurrency(existingProof.amountPaid)}</strong>
            </span>
            {existingProof.receiptImageUrl && (
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="inline-flex items-center gap-1 font-semibold underline text-amber-950 hover:text-black ml-2"
              >
                <Eye className="w-3.5 h-3.5" />
                View Uploaded Receipt
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {submittedSuccess && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Payment screenshot submitted successfully! The landlord will verify and update your bill status.</span>
        </div>
      )}

      {/* SUBMISSION FORM */}
      <form onSubmit={handleSubmit} className="mt-5 pt-4 border-t border-[#2C332B]/15 space-y-3.5 font-sans-dm text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C332B] block">
          Submit Payment Receipt:
        </span>

        {/* Method & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-2.5 py-2 text-xs font-medium text-[#2C332B]"
            >
              <option value="QR Code Scan Payment">QR Code Scan Payment</option>
              <option value="Cash On-Site">Cash On-Site</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
              Amount Transferred (₱)
            </label>
            <input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-2.5 py-2 text-xs font-mono font-semibold text-[#2C332B]"
              required
            />
          </div>
        </div>

        {/* Reference Number & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
              Reference / Transaction No.
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. Transaction / Receipt Ref No."
              className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-2.5 py-2 text-xs font-mono text-[#2C332B]"
              required={method !== 'Cash On-Site'}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-2.5 py-2 text-xs text-[#2C332B]"
              required
            />
          </div>
        </div>

        {/* File Screenshot Uploader */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
            Upload Payment Receipt Screenshot
          </label>
          <div className="border-2 border-dashed border-[#2C332B]/30 rounded p-3 text-center bg-[#EFECE6]/40 hover:bg-[#EFECE6]/70 transition-colors relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload payment receipt image"
            />
            {screenshotData ? (
              <div className="flex items-center justify-center gap-3">
                <img
                  src={screenshotData}
                  alt="Receipt Preview"
                  className="w-14 h-14 object-cover rounded border border-[#2C332B]/30"
                />
                <div className="text-left">
                  <div className="font-semibold text-xs text-[#2C332B] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Screenshot Attached
                  </div>
                  <div className="text-[10px] text-[#2C332B]/70">Click or drag another to replace</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <UploadCloud className="w-6 h-6 text-[#2C332B]/60 mb-1" />
                <span className="font-semibold text-xs text-[#2C332B]">
                  Click to select screenshot or drag image here
                </span>
                <span className="text-[10px] text-[#2C332B]/60 mt-0.5">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-[#2C332B] mb-1">
            Tenant Remarks (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Scanned GCash QR on my phone"
            className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs text-[#2C332B]"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-700 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-[#2C332B] hover:bg-black text-[#F7F5F0] font-sans-dm text-xs font-bold tracking-widest uppercase py-2.5 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <FileImage className="w-4 h-4" />
          <span>{existingProof ? 'Update Payment Proof' : 'Submit Payment Proof'}</span>
        </button>
      </form>

      {/* FULL-SIZE MODAL FOR QR CODE ZOOM */}
      {qrModalOpen && paymentSettings?.qrCodeImageUrl && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-5 rounded max-w-sm w-full text-center relative">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute right-3 top-3 text-[#2C332B] hover:opacity-70 p-1"
              aria-label="Close QR Modal"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="font-serif-cormorant text-xl font-bold uppercase text-[#2C332B] mb-1">
              {paymentSettings.qrTitle || 'Official Payment QR'}
            </h4>
            <p className="text-xs text-[#2C332B]/75 mb-3 font-sans-dm">
              Scan directly from your screen with GCash or your bank app.
            </p>
            <div className="p-3 bg-white rounded border border-[#2C332B]/30 shadow-xs inline-block">
              <img
                src={paymentSettings.qrCodeImageUrl}
                alt="Payment QR Full"
                className="w-72 h-72 object-contain"
              />
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="w-full py-2 bg-[#2C332B] text-white rounded text-xs font-bold uppercase tracking-wider"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE MODAL FOR ENLARGING RECEIPT IMAGE */}
      {previewModalOpen && screenshotData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-4 rounded max-w-lg w-full relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2C332B]/20">
              <span className="font-bold text-xs uppercase text-[#2C332B]">Attached Payment Receipt</span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-[#2C332B] hover:opacity-75 p-1"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center">
              <img
                src={screenshotData}
                alt="Payment Receipt Full"
                className="max-w-full max-h-[65vh] object-contain rounded border border-[#2C332B]/30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
