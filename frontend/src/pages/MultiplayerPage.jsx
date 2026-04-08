import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, LogIn, Loader2, Swords, Trophy, Shield, AlertTriangle } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const MODES = [
  { id: 'ffa', label: 'Free For All', desc: 'Svaki za sebe, pobjeđuje s najviše bodova', icon: '⚔️', color: '#8AB4F8' },
  { id: 'teams', label: '2v2 Timovi', desc: 'Podijeli igrače u timove A i B', icon: '🛡️', color: '#55EFC4' },
  { id: 'tournament', label: 'Turnir', desc: 'Bracket turnir, 1v1 do finala', icon: '🏆', color: '#FDCB6E' },
];

const MultiplayerPage = () => {
  usePageTitle('Multiplayer');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [tournamentSize, setTournamentSize] = useState(4);
  const [mode, setMode] = useState('ffa');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('create'); // create | join

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(r => setCategories(r.data.filter(c => c.question_count > 0)))
      .catch(() => {});
  }, []);

  const createRoom = async () => {
    if (!selectedCategory) { setError('Odaberi kategoriju'); return; }
    setCreating(true); setError('');
    try {
      if (mode === 'tournament') {
        const res = await axios.post(`${API_URL}/api/tournaments/create`,
          { category_id: selectedCategory, question_count: questionCount, size: tournamentSize },
          { withCredentials: true }
        );
        navigate(`/multiplayer/tournament/${res.data.tournament_id}`);
      } else {
        const res = await axios.post(`${API_URL}/api/rooms/create`,
          { category_id: selectedCategory, question_count: questionCount, mode, max_players: maxPlayers },
          { withCredentials: true }
        );
        navigate(`/multiplayer/room/${res.data.room_code}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Greška pri kreiranju');
    } finally { setCreating(false); }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('Unesite kod'); return; }
    setJoining(true); setError('');
    try {
      // Try room first, then tournament
      if (code.length === 8) {
        await axios.get(`${API_URL}/api/tournaments/${code}`, { withCredentials: true });
        navigate(`/multiplayer/tournament/${code}`);
      } else {
        await axios.get(`${API_URL}/api/rooms/${code}`, { withCredentials: true });
        navigate(`/multiplayer/room/${code}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Kod nije pronađen');
    } finally { setJoining(false); }
  };

  if (authLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} /></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-10 text-center max-w-md">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
        <h2 className="font-['Nunito'] text-2xl font-bold mb-3">Prijavi se za multiplayer</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Trebaš račun za igranje s prijateljima.</p>
        <button onClick={() => navigate('/auth')} className="btn-primary">Prijavi se</button>
      </div>
    </div>
  );

  const selectedMode = MODES.find(m => m.id === mode);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(138,180,248,0.2)' }}>
            <Swords className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Multiplayer</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Izazovi prijatelje!</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 mb-6 glass">
          {['create', 'join'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: tab === t ? 'var(--surface-solid)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {t === 'create' ? '+ Kreiraj' : '→ Pridruži se'}
            </button>
          ))}
        </div>

        {error && <div className="glass-card rounded-2xl p-4 mb-4 text-center text-sm" style={{ color: 'var(--error)', border: '1px solid rgba(214,48,49,0.3)' }}>{error}</div>}

        {tab === 'create' ? (
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up space-y-5">
            {/* Mode selector */}
            <div>
              <label className="block text-sm font-medium mb-3">Mod igre</label>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className="rounded-2xl p-3 text-center transition-all hover:scale-105"
                    style={{ background: mode === m.id ? `${m.color}20` : 'rgba(255,255,255,0.05)', border: `2px solid ${mode === m.id ? m.color : 'transparent'}` }}>
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <p className="text-xs font-bold">{m.label}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{selectedMode?.desc}</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Kategorija</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="glass-input">
                <option value="">Odaberi kategoriju...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon && c.icon.length <= 2 ? c.icon + ' ' : ''}{c.name} ({c.question_count})</option>)}
              </select>
            </div>

            {/* Question count */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Pitanja po meču</label>
                <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{questionCount}</span>
              </div>
              <input type="range" min={5} max={20} step={5} value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {[5, 10, 15, 20].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>

            {/* FFA max players */}
            {mode === 'ffa' && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Maks. igrača</label>
                  <span className="font-bold text-sm" style={{ color: '#8AB4F8' }}>{maxPlayers}</span>
                </div>
                <input type="range" min={2} max={8} step={1} value={maxPlayers}
                  onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {[2,3,4,5,6,7,8].map(n => <span key={n}>{n}</span>)}
                </div>
                {maxPlayers > 6 && (
                  <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#FDCB6E' }}>
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Više od 6 igrača može usporiti igru na slabijim uređajima
                  </div>
                )}
              </div>
            )}

            {/* Tournament size */}
            {mode === 'tournament' && (
              <div>
                <label className="block text-sm font-medium mb-2">Veličina turnira</label>
                <div className="flex gap-3">
                  {[4, 8, 16].map(s => (
                    <button key={s} onClick={() => setTournamentSize(s)}
                      className="flex-1 py-3 rounded-xl font-bold transition-all"
                      style={{ background: tournamentSize === s ? 'rgba(253,203,110,0.2)' : 'rgba(255,255,255,0.05)', border: `2px solid ${tournamentSize === s ? '#FDCB6E' : 'transparent'}`, color: tournamentSize === s ? '#FDCB6E' : 'var(--text-secondary)' }}>
                      {s}
                    </button>
                  ))}
                </div>
                {tournamentSize === 16 && (
                  <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#FDCB6E' }}>
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    16 igrača = 15 mečeva. Preporučujemo za jači hardware.
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Točno {tournamentSize} igrača mora se pridružiti prije početka.
                </p>
              </div>
            )}

            <button onClick={createRoom} disabled={creating || !selectedCategory}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${selectedMode?.color}, ${selectedMode?.color}cc)` }}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{selectedMode?.icon}</span>}
              Kreiraj {selectedMode?.label}
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kod sobe ili turnira</label>
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="npr. AB12CD ili TURNIR12"
                className="glass-input font-mono text-center text-xl tracking-widest uppercase"
                maxLength={8} onKeyDown={e => e.key === 'Enter' && joinRoom()} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Sobe imaju 6 znakova, turniri 8 znakova.
              </p>
            </div>
            <button onClick={joinRoom} disabled={joining || !joinCode.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-50">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : '→'}
              Pridruži se
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerPage;
