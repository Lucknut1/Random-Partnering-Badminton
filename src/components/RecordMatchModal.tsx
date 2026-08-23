import React, { useState } from 'react';
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
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  players,
  activeLeague,
  checkIns,
  matches,
  onSaveQuickMatch,
  onStartGeneratedMatches,
}) => {
  const [recordMode, setRecordMode] = useState<'quick' | 'live' | 'generator'>('quick');

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
      alert('Pilih 4 pemain untuk partai ganda.');
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
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.65 } });
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
      alert('Pilih 4 pemain terlebih dahulu.');
      return;
    }
    const expectedWinner = liveScoreA > liveScoreB ? 'teamA' : 'teamB';
    if (winner !== expectedWinner) {
      alert('Tim yang dipilih tidak sesuai dengan skor saat ini.');
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-match-title"
        className="clean-card max-w-lg w-full p-5 space-y-4 border border-white/15 shadow-2xl my-6 bg-[#0b100e] animate-scale-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Plus size={16} />
            </div>
            <div>
              <h3 id="record-match-title" className="text-sm font-extrabold text-white">Catat Pertandingan</h3>
              <p className="text-[11px] text-slate-400">Catat hasil pertandingan & update poin klasemen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition"
              title={isMuted ? 'Nyalakan Efek Suara' : 'Matikan Suara'}
              aria-label={isMuted ? 'Nyalakan efek suara' : 'Matikan efek suara'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition"
              aria-label="Tutup dialog catat pertandingan"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#151e2e] p-1 rounded-lg border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRecordMode('quick')}
            className={`py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              recordMode === 'quick' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={13} />
            <span>Quick Input</span>
          </button>
          <button
            type="button"
            onClick={() => setRecordMode('live')}
            className={`py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              recordMode === 'live' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Wasit Live</span>
          </button>
          <button
            type="button"
            onClick={() => setRecordMode('generator')}
            className={`py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              recordMode === 'generator' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Auto Pair</span>
          </button>
        </div>

        {/* MODE 1: QUICK INPUT FORM */}
        {recordMode === 'quick' && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            {/* Format & Category Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Format:</label>
                <select
                  value={scoreFormat}
                  onChange={(e) => {
                    const fmt = e.target.value as ScoreFormat;
                    setScoreFormat(fmt);
                    if (fmt === 'RACE_42') {
                      setQuickScoreA(42);
                      setQuickScoreB(38);
                    } else {
                      setQuickScoreA(21);
                      setQuickScoreB(17);
                    }
                  }}
                  className="text-xs py-1.5"
                >
                  <option value="RACE_42">Race to 42</option>
                  <option value="BWF">Standar BWF (21)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Kategori:</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                  className="text-xs py-1.5"
                >
                  <option value="MD">Ganda Putra (MD)</option>
                  <option value="WD">Ganda Putri (WD)</option>
                  <option value="XD">Ganda Campuran (XD)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Lapangan:</label>
                <select
                  value={courtNum}
                  onChange={(e) => setCourtNum(Number(e.target.value))}
                  className="text-xs py-1.5"
                >
                  {Array.from({ length: activeLeague.courtsCount }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Lap. {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team A Selection & Score */}
            <div className="p-3 bg-[#0d1511] rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">TIM A</span>
                <span className="text-[10px] text-slate-400">Skor Akhir:</span>
              </div>

              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-3 space-y-1.5">
                  <select
                    value={p1A}
                    onChange={(e) => setP1A(e.target.value)}
                    className="text-xs py-1"
                    required
                  >
                    <option value="">Pilih Pemain 1</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'pria' ? 'P' : 'W'} - Lvl {p.level})
                      </option>
                    ))}
                  </select>

                  <select
                    value={p2A}
                    onChange={(e) => setP2A(e.target.value)}
                    className="text-xs py-1"
                    required
                  >
                    <option value="">Pilih Pemain 2</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'pria' ? 'P' : 'W'} - Lvl {p.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={quickScoreA}
                    onChange={(e) => setQuickScoreA(Number(e.target.value))}
                    className="text-center font-extrabold text-xl py-3 text-emerald-400 mono-num"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Team B Selection & Score */}
            <div className="p-3 bg-[#0d1511] rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">TIM B</span>
                <span className="text-[10px] text-slate-400">Skor Akhir:</span>
              </div>

              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-3 space-y-1.5">
                  <select
                    value={p1B}
                    onChange={(e) => setP1B(e.target.value)}
                    className="text-xs py-1"
                    required
                  >
                    <option value="">Pilih Pemain 1</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'pria' ? 'P' : 'W'} - Lvl {p.level})
                      </option>
                    ))}
                  </select>

                  <select
                    value={p2B}
                    onChange={(e) => setP2B(e.target.value)}
                    className="text-xs py-1"
                    required
                  >
                    <option value="">Pilih Pemain 2</option>
                    {leaguePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'pria' ? 'P' : 'W'} - Lvl {p.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={quickScoreB}
                    onChange={(e) => setQuickScoreB(Number(e.target.value))}
                    className="text-center font-extrabold text-xl py-3 text-emerald-400 mono-num"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-action-primary w-full py-2.5 justify-center font-extrabold text-sm"
            >
              Simpan Hasil (+3 Poin Pemenang) ✓
            </button>
          </form>
        )}

        {/* MODE 2: LIVE REFEREE CLICKER */}
        {recordMode === 'live' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={p1A}
                onChange={(e) => setP1A(e.target.value)}
                className="py-1"
              >
                <option value="">Tim A: Pemain 1</option>
                {leaguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Lvl {p.level})</option>
                ))}
              </select>

              <select
                value={p1B}
                onChange={(e) => setP1B(e.target.value)}
                className="py-1"
              >
                <option value="">Tim B: Pemain 1</option>
                {leaguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Lvl {p.level})</option>
                ))}
              </select>

              <select
                value={p2A}
                onChange={(e) => setP2A(e.target.value)}
                className="py-1"
              >
                <option value="">Tim A: Pemain 2</option>
                {leaguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Lvl {p.level})</option>
                ))}
              </select>

              <select
                value={p2B}
                onChange={(e) => setP2B(e.target.value)}
                className="py-1"
              >
                <option value="">Tim B: Pemain 2</option>
                {leaguePlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Lvl {p.level})</option>
                ))}
              </select>
            </div>

            {/* Court Interval Alert for Race 42 */}
            {scoreFormat === 'RACE_42' && (liveScoreA >= 21 || liveScoreB >= 21) && !switchedSide && (
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-center justify-between text-xs text-amber-300">
                <span className="font-bold">Pindah Lapangan (Interval 21)!</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playWhistle();
                    setSwitchedSide(true);
                  }}
                  className="btn-action-primary text-[11px] py-1 px-2"
                >
                  Selesai Pindah ✓
                </button>
              </div>
            )}

            {/* Clicker Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* TIM A Clicker */}
              <div className="p-3 bg-[#0d1511] rounded-xl border border-emerald-500/30 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">TIM A</span>
                <button
                  type="button"
                  onClick={() => handleAddLivePoint('A')}
                  className="w-full py-5 bg-[#1e2a40] hover:bg-[#253552] rounded-xl text-4xl font-black text-white mono-num transition active:scale-95 border border-white/5"
                >
                  {liveScoreA}
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleUndoLivePoint('A')}
                    className="text-slate-400 hover:text-red-400"
                  >
                    -1 Undo
                  </button>
                </div>
              </div>

              {/* TIM B Clicker */}
              <div className="p-3 bg-[#0d1511] rounded-xl border border-cyan-500/30 text-center space-y-2">
                <span className="text-xs font-bold text-cyan-300 block">TIM B</span>
                <button
                  type="button"
                  onClick={() => handleAddLivePoint('B')}
                  className="w-full py-5 bg-[#1e2a40] hover:bg-[#253552] rounded-xl text-4xl font-black text-white mono-num transition active:scale-95 border border-white/5"
                >
                  {liveScoreB}
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleUndoLivePoint('B')}
                    className="text-slate-400 hover:text-red-400"
                  >
                    -1 Undo
                  </button>
                </div>
              </div>
            </div>

            {/* Finish Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleLiveFinish('teamA')}
                className="btn-action-secondary justify-center text-xs"
              >
                Selesai: Tim A Menang
              </button>
              <button
                type="button"
                onClick={() => handleLiveFinish('teamB')}
                className="btn-action-secondary justify-center text-xs"
              >
                Selesai: Tim B Menang
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: SMART AUTO PAIR GENERATOR */}
        {recordMode === 'generator' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#131c2e] rounded-xl border border-white/5 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMixed}
                  onChange={(e) => setAllowMixed(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-white/20"
                />
                <span className="text-slate-300 font-semibold">
                  Izinkan Ganda Campuran (XD) jika ada sisa pemain putra & putri
                </span>
              </label>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {matchmakingResult.proposals.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak cukup pemain yang check-in untuk membentuk partai baru.
                </div>
              ) : (
                matchmakingResult.proposals.map((prop, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#131c2e] rounded-lg border border-white/10 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-emerald-400 mr-2">Lap. {prop.courtNumber}</span>
                      <span className="text-slate-300">
                        {prop.teamA.player1.name} & {prop.teamA.player2.name} vs {prop.teamB.player1.name} & {prop.teamB.player2.name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">
                      {prop.balanceScore}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={matchmakingResult.proposals.length === 0}
              onClick={() => {
                onStartGeneratedMatches(matchmakingResult.proposals);
                onClose();
              }}
              className="btn-action-primary w-full py-2.5 justify-center font-bold text-xs disabled:opacity-40"
            >
              Mulai Jadwal Lapangan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
