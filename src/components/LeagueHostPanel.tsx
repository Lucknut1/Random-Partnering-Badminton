import React, { useEffect, useState } from 'react';
import { Clock, Save, ShieldCheck, Trophy, AlertCircle } from 'lucide-react';
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
    <section className="mx-auto max-w-3xl space-y-5 pb-12" aria-labelledby="host-panel-title">
      <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
            PANEL OPERASIONAL HOST
          </span>
        </div>
        <h1 id="host-panel-title" className="flex items-center gap-2 text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] uppercase">
          <ShieldCheck size={24} />
          <span>Pengaturan Operasional Liga</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-600 font-medium">
          Akses khusus host untuk mengelola jadwal, kapasitas lapangan, dan verifikasi skor {activeLeague.name}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="clean-card bg-white space-y-5 p-5 sm:p-6 border border-[#CBD5E1] shadow-xs">
        <div className="border-b border-[#E2E8F0] pb-2.5">
          <h2 className="flex items-center gap-2 text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
            <Trophy size={16} className="text-[#0B50A1]" />
            <span>Informasi & Jam Main Liga</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Perbarui data operasional liga aktif</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              Nama Liga *
            </label>
            <input
              className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              Lokasi Venue *
            </label>
            <input
              className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              value={form.venue}
              onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              Jumlah Lapangan
            </label>
            <input
              className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
              type="number"
              min={1}
              max={20}
              value={form.courtsCount}
              onChange={(event) => setForm((current) => ({ ...current, courtsCount: Number(event.target.value) }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              Format Skor Default
            </label>
            <select
              className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
              value={form.defaultFormat}
              onChange={(event) => setForm((current) => ({ ...current, defaultFormat: event.target.value as ScoreFormat }))}
            >
              <option value="RACE_42">Race to 42</option>
              <option value="BWF">Standar 21 Poin</option>
            </select>
          </div>

          <div className="rounded-xs border border-[#A3E3B1] bg-[#EDF9F0] p-3.5 sm:col-span-2 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase text-[#157327] tracking-wide">
              <Clock size={14} /> Jam Operasional Sesi (WIB)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">Jam Mulai</label>
                <input
                  className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">Jam Selesai</label>
                <input
                  className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              Deskripsi & Catatan Liga
            </label>
            <textarea
              className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] min-h-24"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
        </div>

        {message && (
          <p className="rounded-xs bg-[#EDF9F0] border border-[#A3E3B1] p-3 text-xs text-[#157327] font-bold">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xs bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-bold flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-yonex-action w-full py-2.5 text-xs font-black justify-center disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? 'Menyimpan...' : 'SIMPAN INFORMASI LIGA'}</span>
        </button>
      </form>
    </section>
  );
};

export default LeagueHostPanel;
