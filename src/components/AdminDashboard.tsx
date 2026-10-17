import React, { useState } from 'react';
import type { Unit, BillItem, PaymentSettings } from '../types/billing.ts';
import {
  calculateConsumption,
  calculateElectricityBill,
  calculateGrandTotal,
  formatCurrency,
  formatKwh,
  formatReading,
  generateAccessCode,
  generateBillShareUrl,
} from '../utils/billing.ts';
import {
  Building2,
  Calculator,
  Key,
  Archive,
  RefreshCw,
  PlusCircle,
  Save,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Sparkles,
  Info,
  DollarSign,
  Zap,
  QrCode,
  UploadCloud,
  FileImage,
  Share2,
  Copy,
} from 'lucide-react';

interface AdminDashboardProps {
  units: Unit[];
  bills: BillItem[];
  paymentSettings?: PaymentSettings;
  onUpdateUnitCode: (unitId: string, newCode: string) => void;
  onSaveBill: (bill: BillItem) => void;
  onDeleteBill: (billId: string) => void;
  onTogglePaid: (billId: string) => void;
  onSwitchToTenant: (accessCode: string) => void;
  onSavePaymentSettings?: (settings: PaymentSettings) => void;
  onResetSeedData: () => void;
  onLogoutAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  units,
  bills,
  paymentSettings,
  onUpdateUnitCode,
  onSaveBill,
  onDeleteBill,
  onTogglePaid,
  onSwitchToTenant,
  onSavePaymentSettings,
  onResetSeedData,
  onLogoutAdmin,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('UNIT A1');
  const [activeTab, setActiveTab] = useState<'editor' | 'codes' | 'archive' | 'qr'>('editor');

  // QR Code Settings State
  const [qrImage, setQrImage] = useState<string>(paymentSettings?.qrCodeImageUrl || '');
  const [qrTitle, setQrTitle] = useState<string>(paymentSettings?.qrTitle || 'Scan QR Code to Pay');
  const [qrInstructions, setQrInstructions] = useState<string>(
    paymentSettings?.instructions ||
      'Scan this QR code using your payment or banking app to pay. Once transferred, submit your screenshot below.'
  );

  // Currently selected unit
  const currentUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // Bills for selected unit
  const unitBills = bills
    .filter((b) => b.unitId === selectedUnitId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const latestUnitBill = unitBills[0];

  // Editor State
  const [editingBillId, setEditingBillId] = useState<string | null>(latestUnitBill?.id || null);
  const [billingPeriod, setBillingPeriod] = useState<string>(
    latestUnitBill?.billingPeriod || 'Current Billing Period'
  );
  const [lastReading, setLastReading] = useState<number>(latestUnitBill?.lastReading ?? 0.0);
  const [currentReading, setCurrentReading] = useState<number>(latestUnitBill?.currentReading ?? 0.0);
  const [perKwhRate, setPerKwhRate] = useState<number>(latestUnitBill?.perKwhRate ?? 15.0);
  const [rent1Label, setRent1Label] = useState<string>(latestUnitBill?.rent1Label || 'Monthly Rent');
  const [rent1Amount, setRent1Amount] = useState<number>(latestUnitBill?.rent1Amount ?? 0.0);
  const [rent2Label, setRent2Label] = useState<string>(latestUnitBill?.rent2Label || '');
  const [rent2Amount, setRent2Amount] = useState<number>(latestUnitBill?.rent2Amount ?? 0.0);
  const [notes, setNotes] = useState<string>(latestUnitBill?.notes || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [proofViewingBill, setProofViewingBill] = useState<BillItem | null>(null);

  // New Code state for active unit
  const [privacyWarningUnit, setPrivacyWarningUnit] = useState<Unit | null>(null);

  // When switching unit tab in the editor
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSaveSuccessMsg(null);
    setShareSuccessMsg(null);
    const targetBills = bills
      .filter((b) => b.unitId === unitId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const topBill = targetBills[0];

    if (topBill) {
      setEditingBillId(topBill.id);
      setBillingPeriod(topBill.billingPeriod);
      setLastReading(topBill.lastReading);
      setCurrentReading(topBill.currentReading);
      setPerKwhRate(topBill.perKwhRate);
      setRent1Label(topBill.rent1Label);
      setRent1Amount(topBill.rent1Amount);
      setRent2Label(topBill.rent2Label);
      setRent2Amount(topBill.rent2Amount);
      setNotes(topBill.notes || '');
    } else {
      setEditingBillId(null);
      setBillingPeriod('Current Billing Period');
      setLastReading(0);
      setCurrentReading(0);
      setPerKwhRate(15.0);
      setRent1Label('Monthly Rent');
      setRent1Amount(0);
      setRent2Label('');
      setRent2Amount(0);
      setNotes('');
    }
  };

  // Start creating a brand new bill cycle for the selected unit
  const handleNewBillCycle = () => {
    setEditingBillId(null);
    setSaveSuccessMsg(null);
    setShareSuccessMsg(null);
    const defaultLast = latestUnitBill ? latestUnitBill.currentReading : 0;
    setBillingPeriod('Bill for Upcoming Period');
    setLastReading(defaultLast);
    setCurrentReading(defaultLast);
    setPerKwhRate(15.0);
    setRent1Label('Monthly Rent');
    setRent1Amount(0);
    setRent2Label('');
    setRent2Amount(0);
    setNotes('Payment due within 5 days of receipt.');
  };

  // Pull Last Reading from Previous Bill button
  const handlePullLastReading = () => {
    if (latestUnitBill) {
      setLastReading(latestUnitBill.currentReading);
      setSaveSuccessMsg(`Pulled reading ${latestUnitBill.currentReading} from previous bill.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      alert('No previous bill found for this unit to pull reading from.');
    }
  };

  // Live Auto-Computations
  const autoConsumption = calculateConsumption(lastReading, currentReading);
  const autoElecBill = calculateElectricityBill(autoConsumption, perKwhRate);
  const autoGrandTotal = calculateGrandTotal(autoElecBill, rent1Amount, rent2Amount);

  // Publish / Save Bill
  const handlePublishBill = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: BillItem = {
      id: editingBillId || `bill-${selectedUnitId.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      unitId: selectedUnitId,
      billingPeriod: billingPeriod.trim() || 'Bill for Current Cycle',
      lastReading: Number(lastReading) || 0,
      currentReading: Number(currentReading) || 0,
      consumptionKwh: autoConsumption,
      perKwhRate: Number(perKwhRate) || 15.0,
      electricityTotal: autoElecBill,
      rent1Label: rent1Label.trim() || 'Rent',
      rent1Amount: Number(rent1Amount) || 0,
      rent2Label: rent2Label.trim(),
      rent2Amount: Number(rent2Amount) || 0,
      grandTotal: autoGrandTotal,
      createdAt: editingBillId && latestUnitBill?.id === editingBillId ? latestUnitBill.createdAt : new Date().toISOString(),
      accessCode: currentUnit.activeAccessCode, // stamped with active tenant code!
      isPaid: editingBillId && latestUnitBill?.id === editingBillId ? latestUnitBill.isPaid : false,
      notes: notes.trim(),
    };

    onSaveBill(newBill);
    setEditingBillId(newBill.id);
    setSaveSuccessMsg('✓ Bill published successfully and stamped with active access code!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Share Bill directly with tenant via Messenger/WhatsApp link
  const handleShareTenantBill = (billToShare?: BillItem) => {
    const targetBill: BillItem = billToShare || {
      id: editingBillId || `bill-${selectedUnitId.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      unitId: selectedUnitId,
      billingPeriod: billingPeriod.trim() || 'Bill for Current Cycle',
      lastReading: Number(lastReading) || 0,
      currentReading: Number(currentReading) || 0,
      consumptionKwh: autoConsumption,
      perKwhRate: Number(perKwhRate) || 15.0,
      electricityTotal: autoElecBill,
      rent1Label: rent1Label.trim() || 'Rent',
      rent1Amount: Number(rent1Amount) || 0,
      rent2Label: rent2Label.trim(),
      rent2Amount: Number(rent2Amount) || 0,
      grandTotal: autoGrandTotal,
      createdAt: editingBillId && latestUnitBill?.id === editingBillId ? latestUnitBill.createdAt : new Date().toISOString(),
      accessCode: currentUnit.activeAccessCode,
      isPaid: editingBillId && latestUnitBill?.id === editingBillId ? latestUnitBill.isPaid : false,
      notes: notes.trim(),
    };

    // Also auto-save to ensure local state is up-to-date
    onSaveBill(targetBill);
    setEditingBillId(targetBill.id);

    const shareUrl = generateBillShareUrl(targetBill);

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `Calibara Apartment - ${targetBill.unitId} Bill`,
          text: `Calibara Apartment Billing Statement (${targetBill.billingPeriod}) - Total Due: ${formatCurrency(targetBill.grandTotal)}`,
          url: shareUrl,
        })
        .catch(() => {
          navigator.clipboard?.writeText(shareUrl);
        });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }

    setShareSuccessMsg(
      `✓ Direct Messenger link copied! Send this to your tenant in Messenger. When they tap it, their phone will load your updated bill instantly.`
    );
    setTimeout(() => setShareSuccessMsg(null), 10000);
  };

  // Access Code generation
  const handleGenerateCodeForUnit = (unit: Unit) => {
    const freshCode = generateAccessCode(unit.id);
    setPrivacyWarningUnit({ ...unit, activeAccessCode: freshCode });
  };

  const confirmCodeChange = () => {
    if (privacyWarningUnit) {
      onUpdateUnitCode(privacyWarningUnit.id, privacyWarningUnit.activeAccessCode);
      setPrivacyWarningUnit(null);
      setSaveSuccessMsg(`✓ Active Access Code for ${privacyWarningUnit.id} updated!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Total building metrics
  const totalOutstanding = bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + b.grandTotal, 0);

  const totalCollected = bills
    .filter((b) => b.isPaid)
    .reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 font-sans-dm text-[#2C332B]">
      {/* Top Admin Header */}
      <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-5 rounded-sm paper-shadow mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2C332B]" />
            <h1 className="font-serif-cormorant text-2xl font-bold tracking-[0.16em] uppercase text-[#2C332B]">
              Calibara Landlord Admin
            </h1>
            <span className="bg-[#2C332B] text-white text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase">
              Master Unlocked
            </span>
          </div>
          <p className="text-xs text-[#2C332B]/75 mt-0.5">
            Manage apartment units, auto-compute submeter billing, and control tenant privacy access codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSwitchToTenant(currentUnit.activeAccessCode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#EFECE6] hover:bg-[#DFDDD4] border border-[#2C332B]/30 text-[#2C332B] transition-colors"
            title="Preview tenant portal as this unit"
          >
            <span>View As Tenant ({currentUnit.id})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLogoutAdmin}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-[#2C332B] hover:bg-black text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Admin
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-3.5 rounded-sm paper-shadow">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2C332B]/70">Units Managed</div>
          <div className="text-xl font-bold text-[#2C332B] mt-1 font-serif-cormorant">5 APARTMENTS</div>
          <div className="text-[10px] text-[#2C332B]/60 mt-0.5">A1, B, C, S1, S2 (All Active)</div>
        </div>

        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-3.5 rounded-sm paper-shadow">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2C332B]/70 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" /> Default Electricity Rate
          </div>
          <div className="text-xl font-bold text-[#2C332B] mt-1 font-serif-cormorant">₱15.00 / kWh</div>
          <div className="text-[10px] text-[#2C332B]/60 mt-0.5">Standard submeter tariff</div>
        </div>

        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-3.5 rounded-sm paper-shadow">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2C332B]/70 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-rose-600" /> Unpaid Dues
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1 font-serif-cormorant">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[10px] text-[#2C332B]/60 mt-0.5">Pending tenant collections</div>
        </div>

        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-3.5 rounded-sm paper-shadow">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2C332B]/70 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled Collections
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-serif-cormorant">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[10px] text-[#2C332B]/60 mt-0.5">Confirmed payments in history</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-[#2C332B]/20 mb-5">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-5 py-2.5 font-sans-dm text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'editor'
              ? 'border-[#2C332B] text-[#2C332B] bg-[#F7F5F0]'
              : 'border-transparent text-[#2C332B]/60 hover:text-[#2C332B]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Auto-Computing Bill Editor
        </button>

        <button
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-5 py-2.5 font-sans-dm text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'codes'
              ? 'border-[#2C332B] text-[#2C332B] bg-[#F7F5F0]'
              : 'border-transparent text-[#2C332B]/60 hover:text-[#2C332B]'
          }`}
        >
          <Key className="w-4 h-4" />
          Access Codes & Privacy
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-5 py-2.5 font-sans-dm text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'archive'
              ? 'border-[#2C332B] text-[#2C332B] bg-[#F7F5F0]'
              : 'border-transparent text-[#2C332B]/60 hover:text-[#2C332B]'
          }`}
        >
          <Archive className="w-4 h-4" />
          Landlord Master Archive ({bills.length})
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2 px-5 py-2.5 font-sans-dm text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'qr'
              ? 'border-[#2C332B] text-[#2C332B] bg-[#F7F5F0]'
              : 'border-transparent text-[#2C332B]/60 hover:text-[#2C332B]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Payment QR Code {qrImage ? '✓' : ''}
        </button>
      </div>

      {/* Global feedback message */}
      {saveSuccessMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{saveSuccessMsg}</span>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: AUTO-COMPUTING BILL EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Unit Selector Bar */}
          <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-3 rounded-sm paper-shadow flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2C332B]">
              Select Unit to Bill:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {units.map((u) => {
                const isSelected = u.id === selectedUnitId;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUnit(u.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                      isSelected
                        ? 'bg-[#2C332B] text-white shadow-sm'
                        : 'bg-[#EFECE6] text-[#2C332B] hover:bg-[#DFDDD4] border border-[#2C332B]/20'
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNewBillCycle}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-[#4A5D43] text-white hover:bg-[#394833] transition-colors ml-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Bill Cycle
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Inputs Form (Left Col 7) */}
            <div className="lg:col-span-7 bg-[#F7F5F0] border border-[#DFDDD4] p-5 md:p-6 rounded-sm paper-shadow">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C332B]/15 mb-4">
                <div>
                  <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                    {editingBillId ? `Edit Bill for ${currentUnit.name}` : `Create New Bill for ${currentUnit.name}`}
                  </h3>
                  <div className="text-[11px] text-[#2C332B]/70 font-mono">
                    Stamped with Active Code: <strong className="text-[#2C332B]">{currentUnit.activeAccessCode}</strong>
                  </div>
                </div>
                {editingBillId && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-mono px-2 py-0.5 rounded">
                    Editing Existing
                  </span>
                )}
              </div>

              {/* Success / Share Alert Banners */}
              {saveSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {shareSuccessMsg && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-300 text-blue-950 rounded text-xs font-medium space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Direct Tenant Link Ready!</span>
                  </div>
                  <p className="text-[11px] text-blue-900/90 leading-relaxed">
                    {shareSuccessMsg}
                  </p>
                </div>
              )}

              <form onSubmit={handlePublishBill} className="space-y-4">
                {/* Billing Period */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C332B] mb-1">
                    Billing Period (Shown in cursive with leaf icons)
                  </label>
                  <input
                    type="text"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    placeholder="e.g. Bill for June - July"
                    className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-3 py-2 text-xs md:text-sm text-[#2C332B] font-medium focus:ring-1 focus:ring-[#2C332B]"
                    required
                  />
                </div>

                {/* Submeter Readings */}
                <div className="p-3.5 bg-[#EFECE6]/70 border border-[#2C332B]/20 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2C332B] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-700" />
                      Electricity Submeter Readings
                    </span>
                    <button
                      type="button"
                      onClick={handlePullLastReading}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2C332B] bg-[#DFDDD4] hover:bg-[#CCC8B8] px-2 py-1 rounded border border-[#2C332B]/20 transition-colors"
                      title="Automatically pull the latest current reading as this cycle's last reading"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Pull Last Reading from Previous Bill
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-1">
                        Last Submeter Reading (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={lastReading}
                        onChange={(e) => setLastReading(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs font-mono font-semibold text-[#2C332B]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-1">
                        Current Submeter Reading (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentReading}
                        onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs font-mono font-semibold text-[#2C332B]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-1">
                        Rate per kWh (₱)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={perKwhRate}
                        onChange={(e) => setPerKwhRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs font-mono font-semibold text-[#2C332B]"
                        required
                      />
                    </div>
                    <div className="bg-[#DFDDD4] p-2 rounded border border-[#2C332B]/15 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-[#2C332B]/80">Auto Computed:</span>
                      <span className="text-xs font-sans-dm font-bold text-[#2C332B]">
                        {formatKwh(autoConsumption)} × {formatCurrency(perKwhRate)} = {formatCurrency(autoElecBill)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rent Inputs */}
                <div className="p-3.5 bg-[#EFECE6]/70 border border-[#2C332B]/20 rounded space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2C332B] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-800" />
                    Monthly Rent Breakdown
                  </span>

                  {/* Rent Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-0.5">
                        Rent 1 Label
                      </label>
                      <input
                        type="text"
                        value={rent1Label}
                        onChange={(e) => setRent1Label(e.target.value)}
                        placeholder="e.g. Rent June"
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs text-[#2C332B]"
                        required
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-0.5">
                        Amount (₱)
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={rent1Amount}
                        onChange={(e) => setRent1Amount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs font-mono font-semibold text-[#2C332B]"
                        required
                      />
                    </div>
                  </div>

                  {/* Rent Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-0.5">
                        Rent 2 Label (Optional - hidden if ₱0)
                      </label>
                      <input
                        type="text"
                        value={rent2Label}
                        onChange={(e) => setRent2Label(e.target.value)}
                        placeholder="e.g. Rent July"
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs text-[#2C332B]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-[#2C332B]/80 mb-0.5">
                        Amount (₱)
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={rent2Amount}
                        onChange={(e) => setRent2Amount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-[#2C332B]/30 rounded px-2.5 py-1.5 text-xs font-mono font-semibold text-[#2C332B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Memo / Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C332B] mb-1">
                    Payment Instructions / Landlord Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Scan payment QR code above or pay on-site at Batas, Silang, Cavite"
                    className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-3 py-1.5 text-xs text-[#2C332B]"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-[#2C332B] hover:bg-black text-white font-sans-dm text-xs font-bold uppercase tracking-wider py-3 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Publish / Update Official Bill
                    </button>

                    {editingBillId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this bill record?')) {
                            onDeleteBill(editingBillId);
                            handleNewBillCycle();
                          }
                        }}
                        className="px-3 py-3 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded font-semibold transition-colors"
                        title="Delete this bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Share Directly with Tenant (Crucial for sending via Messenger / SMS) */}
                  <div className="p-3 bg-[#EFECE6] border border-[#2C332B]/20 rounded space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleShareTenantBill()}
                      className="w-full bg-[#0084FF] hover:bg-[#0074e0] text-white font-sans-dm text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Copy Direct Link for Tenant (Messenger / SMS)</span>
                    </button>
                    <p className="text-[10px] text-[#2C332B]/70 text-center leading-tight">
                      📲 <strong>Send this link in Messenger</strong> so your tenant immediately sees your updated readings &amp; amounts without showing ₱0.00!
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Live Auto-Calculation Preview Card (Right Col 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-5 rounded-sm paper-shadow">
                <div className="flex items-center gap-2 pb-3 border-b border-[#2C332B]/15">
                  <Sparkles className="w-4 h-4 text-[#2C332B]" />
                  <h4 className="font-serif-cormorant text-lg font-bold uppercase tracking-wider text-[#2C332B]">
                    Live Computed Preview
                  </h4>
                </div>

                <div className="mt-4 space-y-2.5 text-xs font-sans-dm">
                  <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                    <span className="text-[#2C332B]/80">Unit:</span>
                    <strong className="text-[#2C332B] font-mono">{currentUnit.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                    <span className="text-[#2C332B]/80">Period:</span>
                    <span className="font-script-caveat text-base text-[#2C332B] font-semibold">{billingPeriod}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                    <span className="text-[#2C332B]/80">Meter Readings:</span>
                    <span className="font-mono">{formatReading(lastReading)} → {formatReading(currentReading)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                    <span className="text-[#2C332B]/80">Total Consumption:</span>
                    <strong className="text-[#2C332B]">{formatKwh(autoConsumption)}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 bg-[#DFDDD4] px-2 rounded font-semibold text-[#2C332B]">
                    <span>Total Electricity Bill:</span>
                    <span className="font-bold">{formatCurrency(autoElecBill)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                    <span className="text-[#2C332B]/80">{rent1Label}:</span>
                    <span>{formatCurrency(rent1Amount)}</span>
                  </div>
                  {rent2Amount > 0 && (
                    <div className="flex justify-between py-1 border-b border-[#2C332B]/10">
                      <span className="text-[#2C332B]/80">{rent2Label}:</span>
                      <span>{formatCurrency(rent2Amount)}</span>
                    </div>
                  )}

                  {/* Grand Total Highlight */}
                  <div className="mt-3 p-3 bg-[#CCC8B8] rounded border-t-2 border-[#2C332B] flex items-center justify-between text-[#2C332B]">
                    <span className="font-bold text-xs uppercase tracking-wider">TOTAL AMOUNT DUE</span>
                    <span className="font-bold text-lg">{formatCurrency(autoGrandTotal)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2C332B]/15 text-[11px] text-[#2C332B]/75 flex items-center justify-between">
                  <span>Target Tenant Code:</span>
                  <span className="font-mono font-bold bg-[#EFECE6] px-2 py-0.5 rounded text-[#2C332B]">
                    {currentUnit.activeAccessCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShareTenantBill()}
                  className="w-full mt-3 py-2 px-3 text-xs font-semibold rounded bg-[#EFECE6] hover:bg-[#DFDDD4] border border-[#2C332B]/20 text-[#2C332B] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#0084FF]" />
                  <span>Copy Direct Tenant Link</span>
                </button>
              </div>

              {/* Quick History List for this Unit */}
              <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-4 rounded-sm paper-shadow">
                <h5 className="font-serif-cormorant text-sm font-bold uppercase tracking-wider text-[#2C332B] mb-2 flex items-center justify-between">
                  <span>Saved Bills for {currentUnit.name}</span>
                  <span className="text-[10px] font-sans-dm font-normal text-[#2C332B]/70">{unitBills.length} Total</span>
                </h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                  {unitBills.map((b) => (
                    <div
                      key={b.id}
                      className={`p-2 rounded transition-colors flex items-center justify-between gap-2 ${
                        b.id === editingBillId
                          ? 'bg-[#2C332B] text-white'
                          : 'bg-[#EFECE6] hover:bg-[#DFDDD4] text-[#2C332B]'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setEditingBillId(b.id);
                          setBillingPeriod(b.billingPeriod);
                          setLastReading(b.lastReading);
                          setCurrentReading(b.currentReading);
                          setPerKwhRate(b.perKwhRate);
                          setRent1Label(b.rent1Label);
                          setRent1Amount(b.rent1Amount);
                          setRent2Label(b.rent2Label);
                          setRent2Amount(b.rent2Amount);
                          setNotes(b.notes || '');
                        }}
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-semibold text-[11px]">{b.billingPeriod}</div>
                        <div className="text-[10px] opacity-75 font-mono">{b.accessCode}</div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="font-bold text-[11px]">{formatCurrency(b.grandTotal)}</div>
                          <div className="text-[10px] opacity-80">{b.isPaid ? 'PAID' : 'DUE'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareTenantBill(b);
                          }}
                          className="p-1 rounded hover:bg-black/20 transition-colors"
                          title="Copy direct link for this bill"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CODES & TENANT PRIVACY MANAGER */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-6 rounded-sm paper-shadow">
            <div className="flex items-start gap-3 pb-4 border-b border-[#2C332B]/15">
              <Key className="w-5 h-5 text-[#2C332B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                  Unit Access Code Manager & Privacy Control
                </h3>
                <p className="text-xs text-[#2C332B]/80 mt-1 leading-relaxed">
                  Every bill is permanently tied to the unit&apos;s Active Access Code at the time it was issued. When a tenant moves out and a new tenant moves in, generating a new code ensures the incoming tenant <strong>cannot view any past tenant bills</strong>, maintaining strict confidentiality.
                </p>
              </div>
            </div>

            {/* Units Code Grid */}
            <div className="mt-5 space-y-4">
              {units.map((unit) => {
                const countBillsUnderCode = bills.filter(
                  (b) => b.unitId === unit.id && b.accessCode === unit.activeAccessCode
                ).length;
                const countArchivedBills = bills.filter(
                  (b) => b.unitId === unit.id && b.accessCode !== unit.activeAccessCode
                ).length;

                return (
                  <div
                    key={unit.id}
                    className="p-4 bg-[#EFECE6] border border-[#2C332B]/20 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-cormorant text-lg font-bold uppercase text-[#2C332B]">
                          {unit.name}
                        </span>
                        <span className="text-xs text-[#2C332B]/70 font-sans-dm">
                          ({unit.floor})
                        </span>
                      </div>
                      <div className="text-xs text-[#2C332B]/75 mt-0.5">
                        Active tenant: <strong>{unit.tenantName}</strong>
                      </div>
                      <div className="text-[11px] text-[#2C332B]/70 mt-1 flex items-center gap-2">
                        <span className="bg-[#DFDDD4] px-2 py-0.5 rounded font-medium">
                          {countBillsUnderCode} bill(s) under current code
                        </span>
                        {countArchivedBills > 0 && (
                          <span className="bg-[#CCC8B8] px-2 py-0.5 rounded font-medium">
                            {countArchivedBills} bill(s) hidden from old tenant
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="bg-[#2C332B] text-white px-3 py-1.5 rounded font-mono text-sm tracking-widest font-bold">
                        {unit.activeAccessCode}
                      </div>

                      <button
                        onClick={() => handleGenerateCodeForUnit(unit)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#CCC8B8] hover:bg-[#DFDDD4] text-[#2C332B] border border-[#2C332B]/30 transition-colors"
                        title="Rotate code for a new tenant"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Rotate Code (New Tenant)
                      </button>

                      <button
                        onClick={() => onSwitchToTenant(unit.activeAccessCode)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-[#2C332B] hover:bg-black text-white transition-colors"
                      >
                        Test Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LANDLORD MASTER ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-6 rounded-sm paper-shadow">
          <div className="flex items-center justify-between pb-4 border-b border-[#2C332B]/15">
            <div>
              <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                Landlord Master Archive (All Units & All Historical Tenancies)
              </h3>
              <p className="text-xs text-[#2C332B]/75 mt-0.5">
                Landlords have full historical visibility into all {bills.length} bills ever created across all codes.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all bills and units back to original seed data?')) {
                  onResetSeedData();
                  setSaveSuccessMsg('Reset to default seed data complete.');
                }
              }}
              className="text-xs text-[#2C332B]/80 hover:text-rose-700 underline font-semibold"
            >
              Reset Seed Data
            </button>
          </div>

          <div className="overflow-x-auto mt-4 border border-[#2C332B]/20 rounded">
            <table className="w-full text-left font-sans-dm text-xs">
              <thead>
                <tr className="bg-[#2C332B] text-white uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Billing Period</th>
                  <th className="py-2.5 px-2 text-right">Last Read</th>
                  <th className="py-2.5 px-2 text-right">Current Read</th>
                  <th className="py-2.5 px-2 text-right">kWh</th>
                  <th className="py-2.5 px-3 text-right">Elec Total</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-center">Tenant Access Code</th>
                  <th className="py-2.5 px-2 text-center">Paid Status</th>
                  <th className="py-2.5 px-3 text-center">Payment Proof</th>
                  <th className="py-2.5 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C332B]/10">
                {bills.map((b) => {
                  const unit = units.find((u) => u.id === b.unitId);
                  const isCurrentActiveCode = unit?.activeAccessCode === b.accessCode;

                  return (
                    <tr key={b.id} className="hover:bg-[#EFECE6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#2C332B]">{b.unitId}</td>
                      <td className="py-2.5 px-3 font-medium text-[#2C332B]">{b.billingPeriod}</td>
                      <td className="py-2.5 px-2 text-right">{formatReading(b.lastReading)}</td>
                      <td className="py-2.5 px-2 text-right">{formatReading(b.currentReading)}</td>
                      <td className="py-2.5 px-2 text-right font-medium">{formatKwh(b.consumptionKwh)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(b.electricityTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#2C332B]">
                        {formatCurrency(b.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                            isCurrentActiveCode
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {b.accessCode}
                          {isCurrentActiveCode ? ' (Active)' : ' (Old)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => onTogglePaid(b.id)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                            b.isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {b.isPaid ? 'PAID' : 'DUE'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {b.paymentProof ? (
                          <button
                            type="button"
                            onClick={() => setProofViewingBill(b)}
                            className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300 px-2 py-0.5 rounded font-semibold"
                            title="Inspect payment screenshot"
                          >
                            <span>Receipt Attached</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#2C332B]/40 italic">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedUnitId(b.unitId);
                            setEditingBillId(b.id);
                            setBillingPeriod(b.billingPeriod);
                            setLastReading(b.lastReading);
                            setCurrentReading(b.currentReading);
                            setPerKwhRate(b.perKwhRate);
                            setRent1Label(b.rent1Label);
                            setRent1Amount(b.rent1Amount);
                            setRent2Label(b.rent2Label);
                            setRent2Amount(b.rent2Amount);
                            setNotes(b.notes || '');
                            setActiveTab('editor');
                          }}
                          className="text-[11px] underline font-semibold text-[#2C332B] hover:text-black mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this bill from archive?')) {
                              onDeleteBill(b.id);
                            }
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT QR CODE & SETTINGS */}
      {activeTab === 'qr' && (
        <div className="bg-[#F7F5F0] border border-[#DFDDD4] p-6 rounded-sm paper-shadow space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-[#2C332B]/15 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#2C332B]" />
                <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                  Official Payment QR Code Settings
                </h3>
              </div>
              <p className="text-xs text-[#2C332B]/80 mt-1 max-w-2xl leading-relaxed">
                Upload a screenshot or photo of your payment QR code (e.g. GCash, Maya, or Bank QR). Tenants will see this exact QR code on their bill page so they can scan it to pay. You can replace or update it whenever your payment details change.
              </p>
            </div>
            {qrImage && (
              <span className="shrink-0 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active QR Loaded
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Col: Upload & Preview (Col 6) */}
            <div className="md:col-span-6 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C332B]">
                QR Code Image / Screenshot
              </label>

              {qrImage ? (
                <div className="p-4 bg-[#EFECE6] border border-[#2C332B]/20 rounded flex flex-col items-center">
                  <div className="bg-white p-3 rounded border border-[#2C332B]/20 shadow-xs mb-3">
                    <img
                      src={qrImage}
                      alt="Active Landlord QR"
                      className="w-56 h-56 object-contain rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded bg-[#2C332B] hover:bg-black text-white transition-colors">
                      <span>Replace Screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const result = ev.target?.result as string;
                              setQrImage(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove the current QR code?')) {
                          setQrImage('');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors"
                    >
                      Remove QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#2C332B]/30 rounded-lg p-8 text-center bg-[#EFECE6]/50 hover:bg-[#EFECE6] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setQrImage(result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload QR code screenshot"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <UploadCloud className="w-10 h-10 text-[#2C332B]/60 mb-2" />
                    <span className="font-bold text-sm text-[#2C332B]">
                      Click to upload QR code screenshot
                    </span>
                    <span className="text-xs text-[#2C332B]/60 mt-1">
                      Supports JPG, PNG, WEBP screenshots (GCash, Maya, Bank)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Titles & Instructions (Col 6) */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C332B] mb-1">
                  Card Display Title
                </label>
                <input
                  type="text"
                  value={qrTitle}
                  onChange={(e) => setQrTitle(e.target.value)}
                  placeholder="e.g. Scan QR Code to Pay"
                  className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-3 py-2 text-xs font-medium text-[#2C332B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C332B] mb-1">
                  Payment Instructions for Tenants
                </label>
                <textarea
                  rows={4}
                  value={qrInstructions}
                  onChange={(e) => setQrInstructions(e.target.value)}
                  placeholder="e.g. Scan this QR code screenshot using your mobile banking or payment app. Upload the payment receipt screenshot below after sending."
                  className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded p-2.5 text-xs text-[#2C332B] leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSavePaymentSettings) {
                      onSavePaymentSettings({
                        qrCodeImageUrl: qrImage,
                        qrTitle: qrTitle.trim(),
                        instructions: qrInstructions.trim(),
                        updatedAt: new Date().toISOString(),
                      });
                      setSaveSuccessMsg('✓ Payment QR Code and instructions updated! Tenants will now see this on their bill.');
                      setTimeout(() => setSaveSuccessMsg(null), 4000);
                    }
                  }}
                  className="w-full bg-[#2C332B] hover:bg-black text-white font-sans-dm text-xs font-bold uppercase tracking-wider py-3 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Payment QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR ROTATING ACCESS CODE (NEW TENANT PRIVACY RULE) */}
      {privacyWarningUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#F7F5F0] border border-[#DFDDD4] p-6 rounded-sm paper-shadow text-[#2C332B]">
            <div className="flex items-center gap-2 text-amber-800 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <h4 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                New Tenant Privacy Reset
              </h4>
            </div>

            <p className="text-xs text-[#2C332B]/85 leading-relaxed">
              You are assigning a new Access Code for <strong>{privacyWarningUnit.id}</strong>:
            </p>

            <div className="my-3 p-3 bg-[#EFECE6] border border-[#2C332B]/20 rounded text-center">
              <div className="text-[10px] uppercase font-bold text-[#2C332B]/60">New Access Code</div>
              <div className="font-mono text-xl font-bold text-[#2C332B] tracking-widest mt-1">
                {privacyWarningUnit.activeAccessCode}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-normal space-y-1">
              <p className="font-bold">🔒 Critical Privacy Protection:</p>
              <p>
                The previous tenant&apos;s code will stop working immediately. The new tenant logging in with this code will <strong>NEVER</strong> see previous tenant bills.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPrivacyWarningUnit(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded bg-[#EFECE6] hover:bg-[#DFDDD4] text-[#2C332B] border border-[#2C332B]/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCodeChange}
                className="px-4 py-2 text-xs font-bold rounded bg-[#2C332B] hover:bg-black text-white"
              >
                Confirm & Activate New Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR INSPECTING TENANT'S PAYMENT PROOF SCREENSHOT */}
      {proofViewingBill && proofViewingBill.paymentProof && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#F7F5F0] border border-[#DFDDD4] p-5 rounded-sm paper-shadow text-[#2C332B]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C332B]/15">
              <div>
                <h4 className="font-serif-cormorant text-xl font-bold uppercase text-[#2C332B]">
                  Payment Proof: {proofViewingBill.unitId}
                </h4>
                <div className="text-xs text-[#2C332B]/70">
                  {proofViewingBill.billingPeriod} • Amount Due: {formatCurrency(proofViewingBill.grandTotal)}
                </div>
              </div>
              <button
                onClick={() => setProofViewingBill(null)}
                className="text-[#2C332B]/70 hover:text-black font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs font-sans-dm bg-[#EFECE6] p-3 rounded border border-[#2C332B]/15">
              <div className="flex justify-between">
                <span className="text-[#2C332B]/70">Payment Channel:</span>
                <strong>{proofViewingBill.paymentProof.method}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2C332B]/70">Reference / Transaction No:</span>
                <strong className="font-mono">{proofViewingBill.paymentProof.referenceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2C332B]/70">Amount Transferred:</span>
                <strong className="text-emerald-800 font-bold">
                  {formatCurrency(proofViewingBill.paymentProof.amountPaid)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2C332B]/70">Date Paid:</span>
                <span>{proofViewingBill.paymentProof.paidDate}</span>
              </div>
              {proofViewingBill.paymentProof.notes && (
                <div className="pt-1 border-t border-[#2C332B]/10 text-[11px] italic">
                  Remarks: {proofViewingBill.paymentProof.notes}
                </div>
              )}
            </div>

            {/* Receipt Image Display */}
            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase text-[#2C332B]/80 block mb-1">
                Receipt Screenshot Attached:
              </span>
              {proofViewingBill.paymentProof.receiptImageUrl ? (
                <div className="max-h-72 overflow-auto border border-[#2C332B]/20 rounded bg-black/5 flex items-center justify-center p-2">
                  <img
                    src={proofViewingBill.paymentProof.receiptImageUrl}
                    alt="Tenant Receipt"
                    className="max-w-full max-h-68 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="p-4 bg-[#EFECE6] rounded text-center text-xs text-[#2C332B]/70 italic">
                  No image attached.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-[#2C332B]/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setProofViewingBill(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#EFECE6] hover:bg-[#DFDDD4] text-[#2C332B] border border-[#2C332B]/20"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  onTogglePaid(proofViewingBill.id);
                  setProofViewingBill(null);
                  setSaveSuccessMsg(`✓ Payment approved and marked as PAID for ${proofViewingBill.unitId}!`);
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                ✓ Approve &amp; Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
