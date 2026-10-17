import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim();
    if (
      clean === '/Calibara0911' ||
      clean.toLowerCase() === '/calibara0911' ||
      clean === 'Calibara0911' ||
      clean.toLowerCase() === 'calibara0911'
    ) {
      setErrorMsg(null);
      setPin('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect landlord authorization password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#F7F5F0] border border-[#DFDDD4] p-6 rounded-sm paper-shadow text-[#2C332B] relative">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-[#2C332B]/60 hover:text-[#2C332B] transition-colors p-1"
          aria-label="Close Admin Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EFECE6] border border-[#2C332B]/20 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-[#2C332B]" />
          </div>
          <h3 className="font-serif-cormorant text-xl font-bold uppercase tracking-wider text-[#2C332B]">
            Landlord Admin Access
          </h3>
          <p className="text-xs text-[#2C332B]/75 mt-0.5 font-sans-dm">
            Enter Landlord authorization password to proceed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="masterPinInput"
              className="block font-sans-dm text-xs font-semibold uppercase tracking-wider text-[#2C332B] mb-1.5 text-center"
            >
              Landlord Password
            </label>
            <input
              id="masterPinInput"
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter password"
              autoFocus
              className="w-full text-center bg-[#EFECE6] border border-[#2C332B]/30 rounded py-2 px-3 font-mono text-sm tracking-wider text-[#2C332B] focus:ring-2 focus:ring-[#2C332B] focus:outline-none"
            />
            {errorMsg && (
              <p className="mt-1.5 text-xs text-rose-700 font-sans-dm text-center font-medium">
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#2C332B] hover:bg-black text-[#F7F5F0] font-sans-dm text-xs font-bold tracking-widest uppercase py-2.5 px-4 rounded transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
};
