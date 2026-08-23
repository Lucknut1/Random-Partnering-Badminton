import React, { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
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
        const isAdmin = await supabaseService.isSuperAdmin(session.user.id);
        if (!isAdmin) {
          await supabaseService.signOut();
          throw new Error('Akun ini tidak memiliki peran super admin.');
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="clean-card w-full max-w-sm space-y-4 border-white/15 bg-[#0e1420] p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <LockKeyhole size={19} />
            </div>
            <div>
              <h2 className="font-extrabold text-white">Akses Super Admin</h2>
              <p className="text-xs text-slate-400">Kelola peserta, liga, periode, dan data.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {isSupabaseConfigured ? (
          <>
            <label className="block text-xs font-bold text-slate-300">
              Email
              <input className="mt-1.5" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className="block text-xs font-bold text-slate-300">
              Password
              <input className="mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
            </label>
          </>
        ) : (
          <>
            <label className="block text-xs font-bold text-slate-300">
              PIN Admin Lokal
              <input className="mt-1.5" type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} required autoComplete="current-password" />
            </label>
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
              Mode lokal aktif. Atur VITE_LOCAL_ADMIN_PIN untuk pengujian, atau hubungkan Supabase untuk produksi.
            </p>
          </>
        )}

        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-action-primary w-full justify-center py-2.5 disabled:opacity-50">
          {submitting ? 'Memeriksa akses...' : 'Masuk sebagai Super Admin'}
        </button>
      </form>
    </div>
  );
};
