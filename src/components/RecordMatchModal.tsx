import React, { useEffect, useState } from 'react';
import { Player, Match, League, CheckInRecord, ScoreFormat, MatchType } from '../types';
import { matchmakingEngine, GeneratedMatchProposal } from '../services/matchmakingEngine';
import { soundEngine } from '../services/soundEffects';
import { getLocalDate } from '../services/dateService';
import { 
  Plus, 
  X, 
  Sparkles, 
  Play, 
  Zap, 
  RotateCcw, 
  Trophy, 
  ArrowLeftRight, 
  ShieldCheck, 
  Volume2,
  VolumeX,
  Shuffle,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type RecordMode = 'quick' | 'live' | 'generator';

interface RecordMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: RecordMode;
  canRandomPartner?: boolean;
  players: Player[];
  activeLeague: League;
  checkIns: CheckInRecord[];
  matches: Match[];
  onSaveQuickMatch: (matchData: {
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
  canRandomPartner = false,
  players,
  activeLeague,
  checkIns,
  matches,
  onSaveQuickMatch,
  onStartGeneratedMatches,
}) => {
  const [recordMode, setRecordMode] = useState<RecordMode>('quick');

  useEffect(() => {
    if (!isOpen) return;
    setRecordMode(initialMode === 'generator' && !canRandomPartner ? 'quick' : initialMode);
  }, [canRandomPartner, initialMode, isOpen]);

  // Common match form states
  const [matchType, setMatchType] = useState<MatchType>('MD');
  const [scoreFormat, setScoreFormat] = useState<ScoreFormat>(activeLeague.defaultFormat || 'RACE_42');
  const [courtNum, setCourtNum] = useState(1);

  // Player selection
  const [p1A, setP1A] = useState('');
  const [p2A, setP2A] = useState('');
  const [p1B, setP1B] = useState('');
  const [p2B, setP2B] = useState('');

  // Quick Score Entry
  const [quickScoreA, setQuickScoreA] = useState<number>(42);
  const [quickScoreB, setQuickScoreB] = useState<number>(38);

  // Live Referee State
  const [liveScoreA, setLiveScoreA] = useState(0);
  const [liveScoreB, setLiveScoreB] = useState(0);
  const [switchedSide, setSwitchedSide] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.getMuted());

  // Auto Generator
  const [allowMixed, setAllowMixed] = useState(true);
  const today = getLocalDate();
  const timeInfo = matchmakingEngine.calculateSessionTimeRemaining(activeLeague);

  const matchmakingResult = matchmakingEngine.generateMatchSchedule(players, checkIns, matches, {
    league: activeLeague,
    date: today,
    courtsAvailable: activeLeague.courtsCount,
    format: scoreFormat,
    allowMixedDoubles: allowMixed,
    remainingMinutes: timeInfo.isSessionActive ? timeInfo.remainingMinutes : 0,
  });

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1A || !p2A || !p1B || !p2B) {
      alert('Pilih 4 atlet untuk partai ganda.');
      return;
    }
    const unique = new Set([p1A, p2A, p1B, p2B]);
    if (unique.size < 4) {
      alert('Pemain dalam 1 partai tidak boleh sama.');
      return;
    }

    const saved = onSaveQuickMatch({
      courtNumber: courtNum,
      matchType,
      format: scoreFormat,
      player1A: p1A,
      player2A: p2A,
      player1B: p1B,
      player2B: p2B,
      scoreA: Number(quickScoreA),
      scoreB: Number(quickScoreB),
    });
    if (!saved) return;
    soundEngine.playVictory();

    try {
      confetti({ particleCount: 45, spread: 65, origin: { y: 0.65 } });
    } catch {}

    onClose();
  };

  const handleAddLivePoint = (team: 'A' | 'B') => {
    soundEngine.playPoint();
    if (team === 'A') {
      const next = liveScoreA + 1;
      setLiveScoreA(next);
      if (scoreFormat === 'RACE_42' && next === 21 && !switchedSide) {
        soundEngine.playWhistle();
      } else if ((scoreFormat === 'RACE_42' && next >= 42) || (scoreFormat === 'BWF' && next >= 21)) {
        soundEngine.playVictory();
      }
    } else {
      const next = liveScoreB + 1;
      setLiveScoreB(next);
      if (scoreFormat === 'RACE_42' && next === 21 && !switchedSide) {
        soundEngine.playWhistle();
      } else if ((scoreFormat === 'RACE_42' && next >= 42) || (scoreFormat === 'BWF' && next >= 21)) {
        soundEngine.playVictory();
      }
    }
  };

  const handleUndoLivePoint = (team: 'A' | 'B') => {
    soundEngine.playUndo();
    if (team === 'A') setLiveScoreA((p) => Math.max(0, p - 1));
    else setLiveScoreB((p) => Math.max(0, p - 1));
  };

  const handleLiveFinish = (winner: 'teamA' | 'teamB') => {
    if (!p1A || !p2A || !p1B || !p2B) {
      alert('Pilih 4 atlet terlebih dahulu.');
      return;
    }
    const expectedWinner = liveScoreA > liveScoreB ? 'teamA' : 'teamB';
    if (winner !== expectedWinner) {
      alert('Tim pemenang tidak sesuai dengan perolehan skor.');
      return;
    }
    const saved = onSaveQuickMatch({
      courtNumber: courtNum,
      matchType,
      format: scoreFormat,
      player1A: p1A,
      player2A: p2A,
      player1B: p1B,
      player2B: p2B,
      scoreA: liveScoreA,
      scoreB: liveScoreB,
    });
    if (!saved) return;
    soundEngine.playVictory();
    onClose();
  };

  const checkedInPlayerIds = new Set(
    checkIns
      .filter((record) => record.date === today && record.leagueId === activeLeague.id)
      .map((record) => record.playerId)
  );
  const checkedInPlayers = players.filter(
    (player) =>
      (player.leagueId === activeLeague.id || player.leagueId === 'all') &&
      checkedInPlayerIds.has(player.id)
  );
  const leaguePlayers = checkedInPlayers.filter((player) => {
    if (matchType === 'MD') return player.gender === 'pria';
    if (matchType === 'WD') return player.gender === 'wanita';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        className="clean-card max-w-lg w-full p-5 sm:p-6 space-y-4 border border-rose-500/30 shadow-2xl my-6 bg-[#0c101c]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
              <Plus size={18} strokeWidth={3} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                MATCH CONTROLLER
              </span>
              <h3 className="text-base font-black text-white font-['Outfit']">
                {recordMode === 'generator' ? 'Random Partnering Engine' : 'Catat Pertandingan'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition"
              title={isMuted ? 'Nyalakan Efek Suara' : 'Matikan Suara'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-amber-400" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className={`grid ${canRandomPartner ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-[#101524] p-1 rounded-xl border border-white/5 text-xs font-black uppercase tracking-wider`}>
          <button
            type="button"
            onClick={() => setRecordMode('quick')}
            className={`py-2 rounded-lg transition ${
              recordMode === 'quick' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Catat Cepat
          </button>
          <button
            type="button"
            onClick={() => setRecordMode('live')}
            className={`py-2 rounded-lg transition ${
              recordMode === 'live' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Wasit Live
          </button>
          {canRandomPartner && (
            <button
              type="button"
              onClick={() => setRecordMode('generator')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                recordMode === 'generator' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Shuffle size={12} />
              <span>Random Pair</span>
            </button>
          )}
        </div>

        {/* MODE 1: QUICK SCORE SUBMISSION */}
        {recordMode === 'quick' && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            {/* Match Configurations */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Partai</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                  className="w-full py-1.5 px-2 rounded-lg bg-[#101524] border-white/10 text-white font-bold"
                >
                  <option value="MD">Ganda Putra (MD)</option>
                  <option value="WD">Ganda Putri (WD)</option>
                  <option value="XD">Ganda Campuran (XD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Format</label>
                <select
                  value={scoreFormat}
                  onChange={(e) => setScoreFormat(e.target.value as ScoreFormat)}
                  className="w-full py-1.5 px-2 rounded-lg bg-[#101524] border-white/10 text-white font-bold"
                >
                  <option value="RACE_42">Race to 42</option>
                  <option value="BWF">Standar 21 Poin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Lapangan</label>
                <select
                  value={courtNum}
                  onChange={(e) => setCourtNum(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-lg bg-[#101524] border-white/10 text-white font-bold"
                >
                  {Array.from({ length: activeLeague.courtsCount }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      Lap. {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Red Corner (Team A) vs Blue Corner (Team B) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TIM A (RED) */}
              <div className="p-3.5 bg-[#14121e] border border-rose-500/30 rounded-xl space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                  TIM A (RED CORNER)
                </div>
                <div className="space-y-1.5">
                  <select
                    value={p1A}
                    onChange={(e) => setP1A(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-lg bg-[#0a0d16] border-white/10 text-white"
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
                    className="w-full text-xs py-1.5 px-2 rounded-lg bg-[#0a0d16] border-white/10 text-white"
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Skor Akhir Tim A</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={quickScoreA}
                    onChange={(e) => setQuickScoreA(Number(e.target.value))}
                    required
                    className="w-full text-center font-mono font-black text-lg py-1 rounded-lg bg-[#0a0d16] border-rose-500/40 text-rose-300"
                  />
                </div>
              </div>

              {/* TIM B (BLUE) */}
              <div className="p-3.5 bg-[#0f1728] border border-sky-500/30 rounded-xl space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                  TIM B (BLUE CORNER)
                </div>
                <div className="space-y-1.5">
                  <select
                    value={p1B}
                    onChange={(e) => setP1B(e.target.value)}
                    required
                    className="w-full text-xs py-1.5 px-2 rounded-lg bg-[#0a0d16] border-white/10 text-white"
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
                    className="w-full text-xs py-1.5 px-2 rounded-lg bg-[#0a0d16] border-white/10 text-white"
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Skor Akhir Tim B</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={quickScoreB}
                    onChange={(e) => setQuickScoreB(Number(e.target.value))}
                    required
                    className="w-full text-center font-mono font-black text-lg py-1 rounded-lg bg-[#0a0d16] border-sky-500/40 text-sky-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-action-secondary text-xs py-2 px-4"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition border-none cursor-pointer"
              >
                Simpan Hasil Laga
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: LIVE REFEREE CONTROLLER */}
        {recordMode === 'live' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* TIM A LIVE DIAL */}
              <div className="p-3 bg-[#14121e] border border-rose-500/30 rounded-xl space-y-2 text-center">
                <div className="text-xs font-black text-rose-400 uppercase">TIM A (RED)</div>
                <div className="text-4xl font-black font-mono text-white my-2">{liveScoreA}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddLivePoint('A')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow"
                  >
                    +1 Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUndoLivePoint('A')}
                    className="px-2.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                  >
                    -1
                  </button>
                </div>
              </div>

              {/* TIM B LIVE DIAL */}
              <div className="p-3 bg-[#0f1728] border border-sky-500/30 rounded-xl space-y-2 text-center">
                <div className="text-xs font-black text-sky-400 uppercase">TIM B (BLUE)</div>
                <div className="text-4xl font-black font-mono text-white my-2">{liveScoreB}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddLivePoint('B')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-lg shadow"
                  >
                    +1 Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUndoLivePoint('B')}
                    className="px-2.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setLiveScoreA(0);
                  setLiveScoreB(0);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Reset Skor
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLiveFinish('teamA')}
                  className="btn-action-secondary text-xs py-1.5 px-3"
                >
                  Tim A Menang
                </button>
                <button
                  type="button"
                  onClick={() => handleLiveFinish('teamB')}
                  className="btn-action-secondary text-xs py-1.5 px-3"
                >
                  Tim B Menang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: RANDOM PARTNERING GENERATOR */}
        {recordMode === 'generator' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>
                Sistem secara otomatis memasangkan atlet berdasarkan kesetaraan level dan riwayat pertemuan terdahulu.
              </span>
            </div>

            <div className="space-y-2">
              {matchmakingResult.proposals.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Jumlah pemain hadir belum mencukupi untuk membuat pasangan pertandingan.
                </div>
              ) : (
                matchmakingResult.proposals.map((prop, idx) => (
                  <div key={idx} className="p-3 bg-[#101524] rounded-xl border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                      <span className="text-amber-400">LAPANGAN {prop.courtNumber}</span>
                      <span>Format: {prop.format === 'RACE_42' ? 'Race 42' : 'Standar 21'}</span>
                    </div>
                    <div className="flex items-center justify-between text-white font-extrabold">
                      <span className="truncate text-rose-300">
                        {prop.teamA.player1.name} & {prop.teamA.player2.name}
                      </span>
                      <span className="text-slate-500 px-2 font-normal text-[10px]">VS</span>
                      <span className="truncate text-sky-300">
                        {prop.teamB.player1.name} & {prop.teamB.player2.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {matchmakingResult.proposals.length > 0 && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onStartGeneratedMatches(matchmakingResult.proposals);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 transition border-none cursor-pointer"
                >
                  Mulai {matchmakingResult.proposals.length} Pertandingan Otomatis
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
