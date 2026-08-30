import React, { useState } from 'react';
import { LockKeyhole, X, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, supabaseService } from '../services/supabaseService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isSupabaseConfigured) {
        const session = await supabaseService.signIn(email.trim(), password);
        await supabaseService.acceptPendingHostInvitations();
        const access = await supabaseService.getAccessContext();
        if (!access.isSuperAdmin && access.hostedLeagueIds.length === 0) {
          await supabaseService.signOut();
          throw new Error('Akun ini tidak memiliki akses super admin atau host liga aktif.');
        }
      } else if (!supabaseService.signInLocal(pin)) {
        throw new Error('PIN admin salah atau VITE_LOCAL_ADMIN_PIN belum diatur.');
      }
      onAuthenticated();
      onClose();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="clean-card w-full max-w-md space-y-5 border border-[#CBD5E1] bg-white p-6 sm:p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xs bg-[#EBF3FC] border border-[#BCD8F8] text-[#0B50A1]">
              <LockKeyhole size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0B50A1] block">
                OTENTIKASI RESMI
              </span>
              <h2 className="text-lg font-black text-[#0F172A] font-['Outfit'] uppercase">
                Akses Operasional
              </h2>
              <p className="text-xs text-slate-500 font-medium">Masuk sebagai super admin atau host liga.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xs hover:bg-[#F1F5F9] transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {isSupabaseConfigured ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                Alamat Email Pengelola *
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full py-2.5 px-3.5 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                Kata Sandi (Password) *
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full py-2.5 px-3.5 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                PIN Admin Lokal *
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Masukkan 6 digit PIN"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full py-2.5 px-3.5 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              />
            </div>
            <p className="rounded-xs border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 font-medium">
              Mode lokal aktif. Atur VITE_LOCAL_ADMIN_PIN untuk pengujian, atau hubungkan Supabase untuk produksi.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xs border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-yonex-action w-full py-3 text-xs font-black justify-center disabled:opacity-50"
        >
          {submitting ? 'Memeriksa akses...' : 'MASUK KE PANEL OPERASIONAL'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginModal;
