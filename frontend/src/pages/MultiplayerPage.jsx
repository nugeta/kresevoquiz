import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, LogIn, Loader2, Swords, Trophy, Shield, AlertTriangle, X } from 'lucide-react';
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
  const [tab, setTab] = useState('create');
  const [difficulty, setDifficulty] = useState('mix');
  const [customMode, setCustomMode] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [showAdblockNotice, setShowAdblockNotice] = useState(() =>
    sessionStorage.getItem('mp-adblock-dismissed') !== '1'
  );

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(r => {
        // Load all available categories and subthemes
        setCategories(r.data);
      })
      .catch(() => {});
  }, []);

  // Helper: render categories hierarchically in select options
  const renderCategoryOptions = (excludeIds = []) => {
    const parents = categories.filter(c => !c.parent_id);
    const getChildren = (parentId) => categories.filter(c => String(c.parent_id) === String(parentId) && !excludeIds.includes(c.id || c._id));
    
    const options = [];

    // Mix option
    if (!excludeIds.includes('mix')) {
      options.push(
        <option key="mix" value="mix">
          🎲 Sve kategorije (Mix)
        </option>
      );
    }

    parents.filter(p => !excludeIds.includes(p.id || p._id)).forEach(p => {
      const pId = p.id || p._id;
      const children = getChildren(pId);
      if (children.length > 0) {
        options.push(
          <optgroup key={pId} label={`${p.icon?.length <= 2 ? p.icon + ' ' : ''}${p.name}`}>
            {!excludeIds.includes(pId) && (
              <option value={pId}>📚 Sve — {p.name}</option>
            )}
            {children.map(c => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.icon?.length <= 2 ? c.icon + ' ' : ''}{c.name}
              </option>
            ))}
          </optgroup>
        );
      } else {
        options.push(
          <option key={pId} value={pId}>
            {p.icon?.length <= 2 ? p.icon + ' ' : ''}{p.name}
          </option>
        );
      }
    });

    // Also include any orphan subthemes
    const renderedIds = new Set(
      categories
        .filter(c => !c.parent_id || parents.some(p => String(p.id || p._id) === String(c.parent_id)))
        .map(c => String(c.id || c._id))
    );
    const orphans = categories.filter(
      c => !renderedIds.has(String(c.id || c._id)) && !excludeIds.includes(c.id || c._id)
    );
    if (orphans.length > 0) {
      options.push(
        <optgroup key="other" label="Ostale teme">
          {orphans.map(o => (
            <option key={o.id || o._id} value={o.id || o._id}>
              {o.icon?.length <= 2 ? o.icon + ' ' : ''}{o.name}
            </option>
          ))}
        </optgroup>
      );
    }

    return options;
  };

  const createRoom = async () => {
    if (!customMode && !selectedCategory) { setError('Odaberi kategoriju'); return; }
    if (customMode && selectedCategoryIds.length < 2) { setError('Odaberi barem 2 kategorije za prilagođeni mix'); return; }
    setCreating(true); setError('');
    try {
      const payload = {
        category_id: customMode ? 'custom' : selectedCategory,
        category_ids: customMode ? selectedCategoryIds : undefined,
        question_count: questionCount,
        difficulty,
        mode,
        max_players: maxPlayers
      };
      if (mode === 'tournament') {
        const res = await axios.post(`${API_URL}/api/tournaments/create`,
          { ...payload, size: tournamentSize },
          { withCredentials: true }
        );
        navigate(`/multiplayer/tournament/${res.data.tournament_id}`);
      } else {
        const res = await axios.post(`${API_URL}/api/rooms/create`, payload, { withCredentials: true });
        navigate(`/multiplayer/room/${res.data.room_code}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Greška pri kreiranju');
    } finally { setCreating(false); }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('Unesi kod sobe'); return; }
    setJoining(true); setError('');
    try {
      // Check if it's a tournament or room
      const res = await axios.get(`${API_URL}/api/rooms/${code}`, { withCredentials: true });
      if (res.data.is_tournament) {
        navigate(`/multiplayer/tournament/${code}`);
      } else {
        navigate(`/multiplayer/room/${code}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Soba nije pronađena');
    } finally { setJoining(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(138, 180, 248, 0.15)' }}>
            <Swords className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Prijava obavezna</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Za igranje multiplayera moraš biti prijavljen kako bi se tvoji rezultati mogli pratiti.
          </p>
          <button onClick={() => navigate('/auth?mode=login')} className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Prijavi se
          </button>
        </div>
      </div>
    );
  }

  const selectedMode = MODES.find(m => m.id === mode);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
            style={{ background: 'rgba(138,180,248,0.15)', color: 'var(--primary)', border: '1px solid rgba(138,180,248,0.3)' }}>
            <Swords className="w-3.5 h-3.5" /> Multiplayer Arena
          </div>
          <h1 className="font-['Nunito'] text-4xl sm:text-5xl font-black mb-3 tracking-tight">
            Igraj s <span className="text-gradient">Prijateljima</span>
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Kreiraj sobu, podijeli kod i natječi se u stvarnom vremenu.
          </p>
        </div>

        {/* Adblock notice banner */}
        {showAdblockNotice && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-fade-in"
            style={{
              background: 'rgba(253, 203, 110, 0.12)',
              border: '1px solid rgba(253, 203, 110, 0.35)',
              color: 'var(--text-primary)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FDCB6E' }} />
            <div className="flex-1">
              <span className="font-semibold" style={{ color: '#FDCB6E' }}>Savjet za glatku igru: </span>
              Neki adblockeri i anti-tracker ekstenzije (uBlock, Brave Shields) mogu blokirati WebSocket vezu i usporiti multiplayer. Ako imate problema s pridruživanjem, privremeno ih isključite za ovu stranicu.
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('mp-adblock-dismissed', '1');
                setShowAdblockNotice(false);
              }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Zatvori obavijest"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        )}

        {/* Tabs: Kreiraj / Pridruži se */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl mb-8 glass-card">
          <button onClick={() => { setTab('create'); setError(''); }}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'create' ? 'btn-primary' : 'hover:opacity-70'}`}
            style={tab !== 'create' ? { color: 'var(--text-secondary)' } : {}}>
            <Plus className="w-4 h-4" /> Kreiraj sobu
          </button>
          <button onClick={() => { setTab('join'); setError(''); }}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'join' ? 'btn-primary' : 'hover:opacity-70'}`}
            style={tab !== 'join' ? { color: 'var(--text-secondary)' } : {}}>
            <LogIn className="w-4 h-4" /> Pridruži se
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl text-sm font-medium animate-shake"
            style={{ background: 'rgba(214, 48, 49, 0.15)', color: '#d63031', border: '1px solid rgba(214, 48, 49, 0.3)' }}>
            {error}
          </div>
        )}

        {tab === 'create' ? (
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in-up">
            {/* Mode selection */}
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Kategorija</label>
                <button onClick={() => { setCustomMode(!customMode); setSelectedCategoryIds([]); setSelectedCategory(''); }}
                  className="text-xs px-2 py-1 rounded-lg transition-all"
                  style={{ background: customMode ? 'rgba(162,155,254,0.2)' : 'var(--glass-bg)', color: customMode ? '#A29BFE' : 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                  {customMode ? '✓ Prilagođeni mix' : '🎲 Prilagođeni mix'}
                </button>
              </div>
              {customMode ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCategoryIds.map(id => {
                      const cat = categories.find(c => (c.id || c._id) === id);
                      return cat ? (
                        <span key={id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                          style={{ background: `${cat.color || '#8AB4F8'}20`, color: cat.color || '#8AB4F8', border: `1px solid ${cat.color || '#8AB4F8'}40` }}>
                          {cat.name}
                          <button onClick={() => setSelectedCategoryIds(prev => prev.filter(x => x !== id))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <select onChange={e => { if (e.target.value && !selectedCategoryIds.includes(e.target.value)) setSelectedCategoryIds(prev => [...prev, e.target.value]); e.target.value = ''; }} className="glass-input">
                    <option value="">Dodaj kategoriju...</option>
                    {renderCategoryOptions(selectedCategoryIds)}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Odaberi 2+ kategorija za mix</p>
                </div>
              ) : (
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="glass-input">
                  <option value="">Odaberi kategoriju...</option>
                  {renderCategoryOptions()}
                </select>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">Težina pitanja</label>
              <div className="grid grid-cols-4 gap-2">
                {[['mix','🎲','Mix'],['easy','🟢','Lako'],['medium','🟡','Srednje'],['hard','🔴','Teško']].map(([val, emoji, label]) => (
                  <button key={val} onClick={() => setDifficulty(val)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: difficulty === val ? 'rgba(138,180,248,0.2)' : 'var(--glass-bg)', border: `2px solid ${difficulty === val ? 'var(--primary)' : 'transparent'}`, color: difficulty === val ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {emoji}<br />{label}
                  </button>
                ))}
              </div>
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
                  {[2, 4, 8, 16, 32].map(s => (
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
                  {tournamentSize === 2 && ' Idealno za testiranje!'}
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
          <div className="glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kod sobe</label>
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="npr. ABCD" maxLength={6}
                className="glass-input text-center text-2xl font-mono tracking-widest uppercase !py-4 font-bold"
                onKeyDown={e => e.key === 'Enter' && joinRoom()} />
            </div>
            <button onClick={joinRoom} disabled={joining || !joinCode.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-4 text-base font-bold disabled:opacity-50">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Pridruži se sobi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerPage;
