import React, { useState } from 'react';
import type { Unit } from '../types/billing.ts';
import { KeyRound, ShieldAlert, ArrowRight, Lock } from 'lucide-react';

interface TenantLoginProps {
  units: Unit[];
  onLogin: (accessCode: string) => boolean;
  onAdminLogin?: () => void;
}

export const TenantLogin: React.FC<TenantLoginProps> = ({
  units,
  onLogin,
  onAdminLogin,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const raw = inputCode.trim();

    // Check if the input is the Master Landlord Password: /Calibara0911
    if (
      raw === '/Calibara0911' ||
      raw.toLowerCase() === '/calibara0911' ||
      raw === 'Calibara0911' ||
      raw.toLowerCase() === 'calibara0911'
    ) {
      if (onAdminLogin) {
        onAdminLogin();
        return;
      }
    }

    const trimmed = raw.toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter your unit access code.');
      return;
    }

    const success = onLogin(trimmed);
    if (!success) {
      setErrorMsg('Invalid Access Code. Please enter the unique code provided by your landlord.');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
      {/* Login Card matching user image.png */}
      <div className="w-full max-w-md bg-[#F7F5F0] border border-[#DFDDD4] rounded-sm p-7 md:p-9 paper-shadow text-[#2C332B]">
        {/* Apartment Icon & Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 flex items-center justify-center mb-2">
            <svg
              className="w-10 h-10 stroke-[#2C332B] fill-none"
              viewBox="0 0 48 48"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 42V18L24 6l18 12v24H6z" />
              <path d="M6 24h36" />
              <path d="M6 32h36" />
              <path d="M20 42v-8h8v8" />
              <rect x="11" y="27" width="5" height="3" />
              <rect x="32" y="27" width="5" height="3" />
              <rect x="11" y="19" width="5" height="3" />
              <rect x="21.5" y="19" width="5" height="3" />
              <rect x="32" y="19" width="5" height="3" />
              <circle cx="24" cy="12" r="2.5" />
            </svg>
          </div>
          <h1 className="font-serif-cormorant text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase text-[#2C332B]">
            CALIBARA APARTMENT
          </h1>
          <p className="font-sans-dm text-[11px] tracking-[0.16em] font-medium text-[#2C332B]/80 mt-1 uppercase">
            BATAS, SILANG, CAVITE
          </p>
          <div className="w-16 h-[1px] bg-[#2C332B]/40 my-3"></div>
          <p className="font-script-caveat text-xl text-[#2C332B] font-semibold">
            Tenant Billing Portal
          </p>
        </div>

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="accessCodeInput"
              className="block font-sans-dm text-xs font-semibold uppercase tracking-wider text-[#2C332B] mb-1.5"
            >
              ENTER UNIT ACCESS CODE
            </label>
            <div className="relative">
              <input
                id="accessCodeInput"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="ENTER YOUR UNIT CODE"
                aria-label="Unit Access Code"
                className="w-full bg-[#EFECE6] border border-[#2C332B]/30 rounded px-3.5 py-2.5 font-mono text-base tracking-wider uppercase text-[#2C332B] placeholder:text-[#2C332B]/40 focus:outline-none focus:ring-2 focus:ring-[#2C332B] focus:border-transparent"
              />
              <KeyRound className="w-4 h-4 text-[#2C332B]/50 absolute right-3.5 top-3.5" />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs text-rose-700 font-sans-dm flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#2C332B] hover:bg-black text-[#F7F5F0] font-sans-dm text-xs font-bold tracking-widest uppercase py-3 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>VIEW MY UNIT BILLS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Privacy Note */}
        <div className="mt-5 p-3.5 bg-[#EFECE6]/70 border border-[#2C332B]/15 rounded text-[11px] text-[#2C332B]/80 font-sans-dm leading-relaxed">
          <p className="font-semibold text-[#2C332B] flex items-center gap-1 mb-0.5">
            <Lock className="w-3 h-3" /> Strict Tenant Privacy:
          </p>
          Your access code exclusively accesses your unit&apos;s bills under this active lease. Past tenant records are kept strictly confidential.
        </div>
      </div>
    </div>
  );
};
