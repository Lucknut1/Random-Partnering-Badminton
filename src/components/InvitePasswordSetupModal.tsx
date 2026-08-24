import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

interface InvitePasswordSetupModalProps {
  isOpen: boolean;
  onCompleted: () => void;
}

export const InvitePasswordSetupModal: React.FC<InvitePasswordSetupModalProps> = ({ isOpen, onCompleted }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmation) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await supabaseService.setInvitedUserPassword(password);
      onCompleted();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kata sandi gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="clean-card w-full max-w-sm space-y-4 border-emerald-500/20 bg-[#0e1420] p-5 shadow-2xl">
        <div className="flex gap-3 border-b border-white/10 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><KeyRound size={19} /></div>
          <div>
            <h2 className="font-extrabold text-white">Aktifkan akun host</h2>
            <p className="text-xs text-slate-400">Buat kata sandi untuk login berikutnya.</p>
          </div>
        </div>
        <label className="block text-xs font-bold text-slate-300">Kata sandi baru<input className="mt-1.5" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label>
        <label className="block text-xs font-bold text-slate-300">Ulangi kata sandi<input className="mt-1.5" type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></label>
        {error ? <p role="alert" className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p> : null}
        <button type="submit" disabled={saving} className="btn-action-primary w-full justify-center disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan kata sandi'}</button>
      </form>
    </div>
  );
};
