/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { AppMode, BillItem, Unit, PaymentProof, PaymentSettings } from './types/billing.ts';
import { INITIAL_BILLS, INITIAL_UNITS } from './utils/seedData.ts';
import { filterBillsForTenant, getLatestBill } from './utils/billing.ts';
import { Navbar } from './components/Navbar.tsx';
import { InvoicePaper } from './components/InvoicePaper.tsx';
import { SubmeterHistory } from './components/SubmeterHistory.tsx';
import { TenantLogin } from './components/TenantLogin.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { PaymentProofForm } from './components/PaymentProofForm.tsx';
import { SlidersHorizontal, Info } from 'lucide-react';

// Storage keys version 3 to guarantee pristine 0-pesos initial state
const STORAGE_KEYS = {
  UNITS: 'calibara_units_v3',
  BILLS: 'calibara_bills_v3',
  ACTIVE_CODE: 'calibara_active_code_v3',
  PAYMENT_SETTINGS: 'calibara_payment_settings_v3',
};

export default function App() {
  // 1. Persistent State Initialization (Starts at 0 pesos for all units)
  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [bills, setBills] = useState<BillItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
      return saved
        ? JSON.parse(saved)
        : {
            qrTitle: 'Scan QR Code to Pay',
            instructions:
              'Scan this QR code using your payment or banking app. Once transferred, please submit your payment receipt screenshot below.',
          };
    } catch {
      return {
        qrTitle: 'Scan QR Code to Pay',
        instructions:
          'Scan this QR code using your payment or banking app. Once transferred, please submit your payment receipt screenshot below.',
      };
    }
  });

  // Default to null so EVERYONE lands on the Tenant Login screen first!
  const [tenantCode, setTenantCode] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code');
      if (urlCode && urlCode !== '/Calibara0911' && urlCode !== 'Calibara0911') {
        return urlCode.toUpperCase();
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (
        params.get('admin') === 'Calibara0911' ||
        params.get('code') === '/Calibara0911' ||
        params.get('code') === 'Calibara0911' ||
        hash === '#Calibara0911' ||
        hash === '#admin'
      ) {
        return true;
      }
      return sessionStorage.getItem('calibara_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (
        params.get('admin') === 'Calibara0911' ||
        params.get('code') === '/Calibara0911' ||
        hash === '#Calibara0911' ||
        hash === '#admin'
      ) {
        return 'admin';
      }
      const savedMode = sessionStorage.getItem('calibara_mode');
      return savedMode === 'admin' ? 'admin' : 'tenant';
    } catch {
      return 'tenant';
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [selectedPastBill, setSelectedPastBill] = useState<BillItem | null>(null);
  const [layoutOrder, setLayoutOrder] = useState<'csv' | 'grouped'>('csv');

  // Sync mode and admin state to session
  useEffect(() => {
    try {
      sessionStorage.setItem('calibara_mode', mode);
      sessionStorage.setItem('calibara_admin_unlocked', isAdminUnlocked ? 'true' : 'false');
    } catch (e) {
      console.warn('Session sync error:', e);
    }
  }, [mode, isAdminUnlocked]);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(paymentSettings));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [paymentSettings]);

  useEffect(() => {
    try {
      if (tenantCode) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CODE, tenantCode);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CODE);
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [tenantCode]);

  // Tenant Authentication handler
  const handleTenantLogin = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    const matchedUnit = units.find((u) => u.activeAccessCode.toUpperCase() === normalized);
    if (matchedUnit) {
      setTenantCode(normalized);
      setSelectedPastBill(null);
      setMode('tenant');
      return true;
    }
    return false;
  };

  const handleTenantLogout = () => {
    setTenantCode(null);
    setSelectedPastBill(null);
  };

  // Direct Landlord Unlock (via /Calibara0911)
  const handleDirectAdminUnlock = () => {
    setIsAdminUnlocked(true);
    setIsPinModalOpen(false);
    setMode('admin');
  };

  const handleOpenAdmin = () => {
    if (isAdminUnlocked) {
      setMode('admin');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleAdminLock = () => {
    setIsAdminUnlocked(false);
    setMode('tenant');
    sessionStorage.removeItem('calibara_admin_unlocked');
  };

  // Bill Actions
  const handleSaveBill = (updatedBill: BillItem) => {
    setBills((prev) => {
      const exists = prev.some((b) => b.id === updatedBill.id);
      if (exists) {
        return prev.map((b) => (b.id === updatedBill.id ? updatedBill : b));
      }
      return [updatedBill, ...prev];
    });
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    if (selectedPastBill?.id === billId) {
      setSelectedPastBill(null);
    }
  };

  const handleTogglePaid = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          const nextPaid = !b.isPaid;
          return {
            ...b,
            isPaid: nextPaid,
            paidDate: nextPaid ? new Date().toISOString().split('T')[0] : undefined,
            paymentProof: b.paymentProof
              ? {
                  ...b.paymentProof,
                  status: nextPaid ? 'verified' : 'pending',
                }
              : undefined,
          };
        }
        return b;
      })
    );
  };

  // Handle Payment Proof Submission from Tenant
  const handleSubmitPaymentProof = (proof: PaymentProof) => {
    if (!displayedBill) return;
    const updated: BillItem = {
      ...displayedBill,
      paymentProof: proof,
    };
    handleSaveBill(updated);
    if (selectedPastBill) {
      setSelectedPastBill(updated);
    }
  };

  // Update Access Code (Privacy rotation)
  const handleUpdateUnitCode = (unitId: string, newCode: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, activeAccessCode: newCode } : u))
    );
  };

  // Reset to initial seed data (all starting at 0 pesos)
  const handleResetSeedData = () => {
    setUnits(INITIAL_UNITS);
    setBills(INITIAL_BILLS);
    setTenantCode(null);
    setSelectedPastBill(null);
  };

  // Derived state for active tenant view
  const activeUnit = units.find((u) => u.activeAccessCode === tenantCode);
  const tenantBills = tenantCode ? filterBillsForTenant(bills, tenantCode) : [];
  const latestTenantBill = getLatestBill(tenantBills);
  const displayedBill = selectedPastBill || latestTenantBill;

  return (
    <div className="min-h-screen bg-[#E5E2DC] flex flex-col font-sans-dm selection:bg-[#CCC8B8] selection:text-[#2C332B]">
      {/* Top Navigation */}
      <Navbar
        mode={mode}
        activeUnit={activeUnit}
        activeCode={tenantCode || undefined}
        onLogoutTenant={handleTenantLogout}
        onOpenAdmin={handleOpenAdmin}
        onSwitchToTenantView={() => setMode('tenant')}
      />

      {/* Main View Area */}
      <main className="flex-1 py-8 px-4 flex flex-col items-center">
        {mode === 'admin' && isAdminUnlocked ? (
          <AdminDashboard
            units={units}
            bills={bills}
            paymentSettings={paymentSettings}
            onUpdateUnitCode={handleUpdateUnitCode}
            onSaveBill={handleSaveBill}
            onDeleteBill={handleDeleteBill}
            onTogglePaid={handleTogglePaid}
            onSwitchToTenant={(code) => {
              setTenantCode(code);
              setSelectedPastBill(null);
              setMode('tenant');
            }}
            onSavePaymentSettings={setPaymentSettings}
            onResetSeedData={handleResetSeedData}
            onLogoutAdmin={handleAdminLock}
          />
        ) : !tenantCode ? (
          /* 1. FIRST SCREEN USERS SEE: EXACT MATCH OF THE ATTACHED IMAGE */
          <TenantLogin
            units={units}
            onLogin={handleTenantLogin}
            onAdminLogin={handleDirectAdminUnlock}
          />
        ) : (
          /* 2. TENANT INVOICE & BILLING VIEW */
          <div className="w-full flex flex-col items-center">
            {/* Quick Layout & Unit Bar (No Print) */}
            <div className="no-print w-full max-w-[540px] mb-4 flex items-center justify-between text-xs text-[#2C332B]/80 px-1">
              <div className="flex items-center gap-1 font-medium">
                <span>Leased to: <strong>{activeUnit?.tenantName || activeUnit?.name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLayoutOrder((prev) => (prev === 'csv' ? 'grouped' : 'csv'))}
                  className="inline-flex items-center gap-1 text-[11px] underline hover:text-black font-medium"
                  title="Toggle table row ordering"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Order: {layoutOrder === 'csv' ? 'Image Exact' : 'Subtotal First'}
                </button>
              </div>
            </div>

            {displayedBill ? (
              <>
                {/* Visual Invoice Paper */}
                <InvoicePaper
                  bill={displayedBill}
                  isPastRecord={Boolean(selectedPastBill)}
                  onReturnToLatest={() => setSelectedPastBill(null)}
                  layoutOrder={layoutOrder}
                />

                {/* Where to send money (QR Code) & Submit proof of payment form */}
                <PaymentProofForm
                  bill={displayedBill}
                  paymentSettings={paymentSettings}
                  onSubmitProof={handleSubmitPaymentProof}
                />

                {/* Submeter Reading Continuity & Previous Bill History */}
                <SubmeterHistory
                  bills={tenantBills}
                  currentBillId={displayedBill.id}
                  onSelectBill={(b) => setSelectedPastBill(b)}
                />
              </>
            ) : (
              <div className="w-full max-w-[540px] bg-[#F7F5F0] border border-[#DFDDD4] p-8 text-center paper-shadow rounded-sm">
                <Info className="w-8 h-8 text-[#2C332B]/50 mx-auto mb-2" />
                <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
                  No Published Bills for Code {tenantCode}
                </h3>
                <p className="text-xs text-[#2C332B]/75 mt-1">
                  The landlord has not published any billing statements for this access code yet.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print w-full py-6 px-4 border-t border-[#DFDDD4] bg-[#E5E2DC] text-center text-xs text-[#2C332B]/70 font-sans-dm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="font-serif-cormorant font-bold uppercase tracking-wider text-[#2C332B]">
              Calibara Apartment
            </span>{' '}
            • Batas, Silang, Cavite, Philippines
          </div>
          <div className="text-[11px] text-[#2C332B]/60">
            Tenant Billing &amp; Submeter Accounting Portal
          </div>
        </div>
      </footer>

      {/* Discreet Master Admin Modal (Opens on triple-clicking logo or entering secret) */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onUnlock={handleDirectAdminUnlock}
      />
    </div>
  );
}
