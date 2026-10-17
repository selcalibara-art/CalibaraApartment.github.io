import React, { useState } from 'react';
import type { AppMode, Unit } from '../types/billing.ts';
import { LogOut, KeyRound } from 'lucide-react';

interface NavbarProps {
  mode: AppMode;
  activeUnit?: Unit;
  activeCode?: string;
  onLogoutTenant: () => void;
  onOpenAdmin: () => void;
  onSwitchToTenantView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  activeUnit,
  activeCode,
  onLogoutTenant,
  onOpenAdmin,
  onSwitchToTenantView,
}) => {
  const [clickCount, setClickCount] = useState(0);

  // Discreet Landlord trigger: Clicking the brand icon 3 times opens Admin PIN modal
  const handleLogoClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 3) {
      setClickCount(0);
      onOpenAdmin();
    }
  };

  return (
    <header className="no-print w-full bg-[#F7F5F0] border-b border-[#DFDDD4] py-3 px-4 md:px-8 shadow-xs sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
        {/* Brand with subtle secret triple-click for landlord */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer select-none"
          title={mode === 'admin' ? 'Calibara Admin' : 'Calibara Apartment'}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-[#2C332B] text-white rounded">
            <svg
              className="w-5 h-5 stroke-white fill-none"
              viewBox="0 0 48 48"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 42V18L24 6l18 12v24H6z" />
              <path d="M6 24h36" />
              <path d="M6 32h36" />
              <path d="M20 42v-8h8v8" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif-cormorant text-base md:text-lg font-bold tracking-[0.16em] uppercase text-[#2C332B] leading-none">
              CALIBARA APARTMENT
            </h1>
            <p className="font-sans-dm text-[9px] md:text-[10px] tracking-[0.12em] text-[#2C332B]/75 uppercase font-medium mt-0.5">
              Tenant Portal &amp; Submeter Billing
            </p>
          </div>
        </div>

        {/* Right side controls: Notice "Landlord Admin" button is HIDDEN in tenant view */}
        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'tenant' && activeCode ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#EFECE6] border border-[#2C332B]/20 px-2.5 py-1 rounded text-xs">
                <span className="font-bold text-[#2C332B]">{activeUnit?.name || 'Unit'}</span>
                <span className="text-[#2C332B]/50">•</span>
                <span className="font-mono text-[11px] text-[#2C332B]/80">{activeCode}</span>
              </div>
              <button
                onClick={onLogoutTenant}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 text-[#2C332B]/80 hover:text-black hover:bg-[#EFECE6] rounded transition-colors"
                title="Log out or switch unit"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Unit</span>
              </button>
            </div>
          ) : null}

          {mode === 'admin' && (
            <button
              onClick={onSwitchToTenantView}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 font-medium rounded bg-[#EFECE6] hover:bg-[#DFDDD4] border border-[#2C332B]/30 text-[#2C332B] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Back to Tenant Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
