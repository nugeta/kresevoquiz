import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, LogIn, Loader2, BookOpen } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const MultiplayerPage = () => {
  usePageTitle('Multiplayer');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(r => { setCategories(r.data.filter(c => c.question_count > 0)); })
      .catch(() => {});
  }, []);

  const createRoom = async () => {
    if (!selectedCategory) { setError('Odaberi kategoriju'); return; }
    setCreating(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/rooms/create`,
        { category_id: selectedCategory, question_count: questionCount },
        { withCredentials: true }
      );
      navigate(`/multiplayer/room/${res.data.room_code}`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Greška pri kreiranju sobe');
    } finally { setCreating(false); }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) { setError('Unesite kod sobe'); return; }
    setJoining(true); setError('');
    try {
      await axios.get(`${API_URL}/api/rooms/${joinCode.trim().toUpperCase()}`, { withCredentials: true });
      navigate(`/multiplayer/room/${joinCode.trim().toUpperCase()}`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Soba nije pronađena');
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(138,180,248,0.2)' }}>
            <Users className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Multiplayer</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Izazovi prijatelja na kviz dvoboj!</p>
        </div>

        {error && (
          <div className="glass-card rounded-2xl p-4 mb-6 text-center text-sm" style={{ color: 'var(--error)', border: '1px solid rgba(214,48,49,0.3)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(85,239,196,0.2)' }}>
                <Plus className="w-5 h-5" style={{ color: '#55EFC4' }} />
              </div>
              <h2 className="font-bold text-lg">Kreiraj sobu</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategorija</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="glass-input">
                  <option value="">Odaberi kategoriju...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon && c.icon.length <= 2 ? c.icon + ' ' : ''}{c.name} ({c.question_count})</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Broj pitanja</label>
                  <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{questionCount}</span>
                </div>
                <input type="range" min={5} max={20} step={5} value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {[5, 10, 15, 20].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>
              <button onClick={createRoom} disabled={creating || !selectedCategory} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Kreiraj sobu
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(253,203,110,0.2)' }}>
                <LogIn className="w-5 h-5" style={{ color: '#FDCB6E' }} />
              </div>
              <h2 className="font-bold text-lg">Pridruži se sobi</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kod sobe</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="npr. AB12CD"
                  className="glass-input font-mono text-center text-xl tracking-widest uppercase"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Zatraži kod od prijatelja koji je kreirao sobu.
              </p>
              <button onClick={joinRoom} disabled={joining || !joinCode.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FDCB6E, #F59E0B)' }}>
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Pridruži se
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerPage;
