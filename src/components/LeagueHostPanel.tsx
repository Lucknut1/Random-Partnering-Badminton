import React, { useEffect, useState } from 'react';
import { Clock, Save, ShieldCheck, Trophy } from 'lucide-react';
import { League, ScoreFormat } from '../types';

interface LeagueHostPanelProps {
  activeLeague: League;
  onUpdateLeague: (league: League) => Promise<void>;
}

export const LeagueHostPanel: React.FC<LeagueHostPanelProps> = ({ activeLeague, onUpdateLeague }) => {
  const [form, setForm] = useState(activeLeague);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(activeLeague);
    setMessage('');
    setError('');
  }, [activeLeague]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onUpdateLeague(form);
      setMessage('Informasi operasional liga berhasil diperbarui.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Informasi liga gagal diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="host-panel-title">
      <div>
        <h1 id="host-panel-title" className="flex items-center gap-2 text-2xl font-black text-emerald-400">
          <ShieldCheck size={25} /> Panel Host Liga
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Akses terbatas pada informasi operasional, verifikasi hasil, dan koreksi skor {activeLeague.name}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="clean-card space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-white"><Trophy size={18} /> Informasi liga</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-300 sm:col-span-2">
            Nama liga
            <input className="mt-1.5" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="text-xs font-bold text-slate-300 sm:col-span-2">
            Lokasi
            <input className="mt-1.5" value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} required />
          </label>
          <label className="text-xs font-bold text-slate-300">
            Jumlah lapangan
            <input className="mt-1.5" type="number" min={1} max={20} value={form.courtsCount} onChange={(event) => setForm((current) => ({ ...current, courtsCount: Number(event.target.value) }))} required />
          </label>
          <label className="text-xs font-bold text-slate-300">
            Format skor
            <select className="mt-1.5" value={form.defaultFormat} onChange={(event) => setForm((current) => ({ ...current, defaultFormat: event.target.value as ScoreFormat }))}>
              <option value="RACE_42">Race to 42</option>
              <option value="BWF">Standar 21 Poin</option>
            </select>
          </label>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:col-span-2">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-300"><Clock size={14} /> Jam operasional</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] text-slate-400">Mulai<input className="mt-1" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} required /></label>
              <label className="text-[11px] text-slate-400">Selesai<input className="mt-1" type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} required /></label>
            </div>
          </div>
          <label className="text-xs font-bold text-slate-300 sm:col-span-2">
            Deskripsi
            <textarea className="mt-1.5 min-h-24" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
        {message ? <p className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-300">{message}</p> : null}
        {error ? <p role="alert" className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p> : null}
        <button type="submit" disabled={saving} className="btn-action-primary justify-center disabled:opacity-50">
          <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan informasi liga'}
        </button>
      </form>
    </section>
  );
};
