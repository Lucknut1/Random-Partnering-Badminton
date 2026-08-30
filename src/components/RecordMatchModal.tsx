import React, { useState, useEffect } from 'react';
import { Player, Match, League, ScoreFormat, MatchType, CheckInRecord } from '../types';
import { matchmakingEngine, GeneratedMatchProposal } from '../services/matchmakingEngine';
import { soundEngine } from '../services/soundEffects';
import { getLocalDate } from '../services/dateService';
import { Plus, Shuffle, X, Volume2, VolumeX, AlertCircle } from 'lucide-react';

export type RecordMode = 'quick' | 'live' | 'generator';

export interface RecordMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: RecordMode;
  canRandomPartner: boolean;
  players: Player[];
  activeLeague: League;
  checkIns: CheckInRecord[];
  matches: Match[];
  onSaveQuickMatch: (data: {
    courtNumber: number;
    matchType: MatchType;
    format: ScoreFormat;
    player1A: string;
    player2A: string;
    player1B: string;
    player2B: string;
    scoreA: number;
    scoreB: number;
  }) => boolean;
  onStartGeneratedMatches: (proposals: GeneratedMatchProposal[]) => void;
}

export const RecordMatchModal: React.FC<RecordMatchModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'quick',
  canRandomPartner,
  players,
  activeLeague,
  checkIns,
  matches,
  onSaveQuickMatch,
  onStartGeneratedMatches,
}) => {
  const [recordMode, setRecordMode] = useState<RecordMode>(initialMode);
  const [matchType, setMatchType] = useState<MatchType>('MD');
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>(activeLeague.defaultFormat);
  const [courtNum, setCourtNum] = useState<number>(1);

  // Lineup Players
  const [p1A, setP1A] = useState('');
  const [p2A, setP2A] = useState('');
  const [p1B, setP1B] = useState('');
  const [p2B, setP2B] = useState('');

  // Scores
  const [scoreA, setScoreA] = useState<number | ''>('');
  const [scoreB, setScoreB] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(() => soundEngine.getMuted());
  const [generatedProposals, setGeneratedProposals] = useState<GeneratedMatchProposal[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecordMode(initialMode);
      setErrorMsg('');
      if (initialMode === 'generator') {
        handleRunMatchmaking();
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const leaguePlayers = players.filter(
    (p) => p.leagueId === activeLeague.id || p.leagueId === 'all'
  );

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleRunMatchmaking = () => {
    const today = getLocalDate();
    const activeMatchesCount = matches.filter(
      (m) => m.leagueId === activeLeague.id && m.status === 'IN_PROGRESS'
    ).length;
    const courtsAvail = Math.max(1, activeLeague.courtsCount - activeMatchesCount);

    const result = matchmakingEngine.generateMatchSchedule(
      players,
      checkIns,
      matches,
      {
        league: activeLeague,
        date: today,
        courtsAvailable: courtsAvail,
        format: activeLeague.defaultFormat,
        allowMixedDoubles: true,
      }
    );

    setGeneratedProposals(result.proposals);
  };

  const validateLineup = () => {
    if (!p1A || !p2A || !p1B || !p2B) {
      setErrorMsg('Harap lengkapi keempat atlet pertandingan.');
      return false;
    }
    const set = new Set([p1A, p2A, p1B, p2B]);
    if (set.size !== 4) {
      setErrorMsg('Pemain yang sama tidak boleh didaftarkan di posisi ganda yang berbeda.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLineup()) return;

    const numScoreA = Number(scoreA);
    const numScoreB = Number(scoreB);

    if (isNaN(numScoreA) || isNaN(numScoreB) || scoreA === '' || scoreB === '') {
      setErrorMsg('Harap masukkan skor kedua tim.');
      return;
    }

    if (numScoreA === numScoreB) {
      setErrorMsg('Skor akhir pertandingan bulutangkis tidak boleh seri.');
      return;
    }

    const success = onSaveQuickMatch({
      matchType,
      courtNumber: courtNum,
      format: scoreFormat,
      player1A: p1A,
      player2A: p2A,
      player1B: p1B,
      player2B: p2B,
      scoreA: numScoreA,
      scoreB: numScoreB,
    });

    if (success) {
      soundEngine.playVictory();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="clean-card max-w-lg w-full p-5 sm:p-6 space-y-4 border border-[#CBD5E1] shadow-2xl my-6 bg-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#0B50A1] text-white flex items-center justify-center shadow-xs">
              <Plus size={18} strokeWidth={3} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0B50A1]">
                KONTROL PERTANDINGAN
              </span>
              <h3 className="text-base font-black text-[#0F172A] font-['Outfit'] uppercase">
                {recordMode === 'generator' ? 'Random Partnering Engine' : 'Catat Pertandingan'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-xs hover:bg-[#F1F5F9] transition"
              title={isMuted ? 'Nyalakan Efek Suara' : 'Matikan Suara'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#0B50A1]" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-xs hover:bg-[#F1F5F9] transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Yonex Blue / Light Mode) */}
        <div className={`grid ${canRandomPartner ? 'grid-cols-2' : 'grid-cols-1'} gap-1 bg-[#F1F5F9] p-1 rounded-xs border border-[#CBD5E1] text-xs font-black uppercase tracking-wider`}>
          <button
            type="button"
            onClick={() => setRecordMode('quick')}
            className={`py-2 rounded-xs transition ${
              recordMode === 'quick' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
            }`}
          >
            Catat Skor Cepat
          </button>
          {canRandomPartner && (
            <button
              type="button"
              onClick={() => {
                setRecordMode('generator');
                handleRunMatchmaking();
              }}
              className={`py-2 rounded-xs transition flex items-center justify-center gap-1 ${
                recordMode === 'generator' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
              }`}
            >
              <Shuffle size={12} />
              <span>Random Partnering</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-red-600 text-xs flex items-center gap-2 font-bold">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: QUICK SCORE SUBMISSION */}
        {recordMode === 'quick' && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            {/* Match Configurations */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Partai</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                  className="w-full py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  <option value="MD">Ganda Putra (MD)</option>
                  <option value="WD">Ganda Putri (WD)</option>
                  <option value="XD">Ganda Campuran (XD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Format</label>
                <select
                  value={scoreFormat}
                  onChange={(e) => setScoreFormat(e.target.value as ScoreFormat)}
                  className="w-full py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  <option value="RACE_42">Race to 42</option>
                  <option value="BWF">Standar 21 Poin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Lapangan</label>
                <select
                  value={courtNum}
                  onChange={(e) => setCourtNum(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  {Array.from({ length: activeLeague.courtsCount }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      Lap. {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team A vs Team B Lineups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TIM A (YONEX BLUE) */}
              <div className="p-3.5 bg-[#F0F6FD] border border-[#BCD8F8] rounded-xs space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#0B50A1]">
                  TIM A
                </div>
                <div className="space-y-1.5">
                  <select
                    value={p1A}
                    onChange={(e) => setP1A(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  >
                    <option value="">-- Pemain 1 --</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department} · Lvl {p.level})
                      </option>
                    ))}
                  </select>

                  <select
                    value={p2A}
                    onChange={(e) => setP2A(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  >
                    <option value="">-- Pemain 2 --</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department} · Lvl {p.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Skor Akhir Tim A</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    placeholder="Contoh: 21 atau 42"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full py-1.5 px-2 text-base font-black font-mono bg-white border-[#CBD5E1] text-[#0B50A1]"
                  />
                </div>
              </div>

              {/* TIM B */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#0F172A]">
                  TIM B
                </div>
                <div className="space-y-1.5">
                  <select
                    value={p1B}
                    onChange={(e) => setP1B(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  >
                    <option value="">-- Pemain 1 --</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department} · Lvl {p.level})
                      </option>
                    ))}
                  </select>

                  <select
                    value={p2B}
                    onChange={(e) => setP2B(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  >
                    <option value="">-- Pemain 2 --</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department} · Lvl {p.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Skor Akhir Tim B</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    placeholder="Contoh: 19 atau 38"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full py-1.5 px-2 text-base font-black font-mono bg-white border-[#CBD5E1] text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                className="btn-yonex-action w-full py-2.5 justify-center"
              >
                Simpan Hasil Laga (+3 Poin)
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: RANDOM PARTNERING GENERATOR */}
        {recordMode === 'generator' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleRunMatchmaking}
                className="btn-yonex-outline text-xs py-2 px-4 uppercase"
              >
                <Shuffle size={13} className="text-[#0B50A1]" />
                <span>Acak Ulang Pasangan</span>
              </button>
              <span className="text-xs text-slate-500 font-bold">
                {generatedProposals.length} Proposal Laga
              </span>
            </div>

            <div className="space-y-2">
              {generatedProposals.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  Jumlah pemain hadir belum mencukupi untuk membuat pasangan pertandingan.
                </div>
              ) : (
                generatedProposals.map((prop: GeneratedMatchProposal, idx: number) => (
                  <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                      <span className="text-[#0B50A1]">LAPANGAN {prop.courtNumber}</span>
                      <span>Format: {prop.format === 'RACE_42' ? 'Race 42' : 'Standar 21'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#0F172A] font-black">
                      <span className="truncate text-[#0B50A1]">
                        {prop.teamA.player1.name} & {prop.teamA.player2.name}
                      </span>
                      <span className="text-slate-400 px-2 font-normal text-[10px]">VS</span>
                      <span className="truncate text-slate-800">
                        {prop.teamB.player1.name} & {prop.teamB.player2.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {generatedProposals.length > 0 && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onStartGeneratedMatches(generatedProposals);
                    onClose();
                  }}
                  className="btn-yonex-action w-full py-2.5 justify-center"
                >
                  Mulai {generatedProposals.length} Pertandingan Otomatis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordMatchModal;
