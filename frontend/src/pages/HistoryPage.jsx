import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Swords, Loader2, LogIn, Share2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const MODE_LABELS = { ffa: 'Free For All', teams: '2v2 Timovi', tournament_match: 'Turnir' };

const HistoryPage = () => {
  usePageTitle('Moja povijest');
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('solo');
  const [soloHistory, setSoloHistory] = useState([]);
  const [multiHistory, setMultiHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    Promise.all([
      axios.get(`${API_URL}/api/quiz/history`, { withCredentials: true }),
      axios.get(`${API_URL}/api/multiplayer/history`, { withCredentials: true })
    ])
      .then(([s, m]) => { setSoloHistory(s.data); setMultiHistory(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const shareEntry = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-10 text-center max-w-md">
        <LogIn className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
        <h2 className="font-['Nunito'] text-2xl font-bold mb-3">Prijavi se</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Prijavi se za pregled svoje povijesti kvizova.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">Prijavi se</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Moja povijest</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Zadnjih 20 odigranih kvizova</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 mb-6 glass">
          <button onClick={() => setTab('solo')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ background: tab === 'solo' ? 'var(--surface-solid)' : 'transparent', color: tab === 'solo' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <Trophy className="w-4 h-4" /> Solo ({soloHistory.length})
          </button>
          <button onClick={() => setTab('multi')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ background: tab === 'multi' ? 'var(--surface-solid)' : 'transparent', color: tab === 'multi' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <Swords className="w-4 h-4" /> Multiplayer ({multiHistory.length})
          </button>
        </div>

        {/* Solo history */}
        {tab === 'solo' && (
          soloHistory.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-bold mb-2">Još nisi igrao/la nijedan kviz</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Odaberi kategoriju i započni!</p>
              <Link to="/categories" className="btn-primary inline-flex items-center gap-2">Igraj kviz</Link>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {soloHistory.map((s, i) => {
                const shareText = `Odigrao/la sam kviz "${s.category_name}" na Kreševo Kviz!\n🏆 ${s.score} bodova | ✅ ${s.correct_answers}/${s.total_questions} (${s.accuracy}%)\n${window.location.origin}/results/${s.session_id}`;
                return (
                  <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--glass-bg)' }}>
                      <Trophy className="w-5 h-5" style={{ color: 'var(--accent-1)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm">{s.category_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {s.completed_at ? new Date(s.completed_at).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-['Nunito'] text-lg font-black" style={{ color: 'var(--primary)' }}>{s.score}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.accuracy}%</p>
                      </div>
                      <button onClick={() => shareEntry(shareText, s.session_id)}
                        className="p-2 rounded-xl hover:opacity-70 transition-opacity" title="Podijeli">
                        {copiedId === s.session_id ? <Copy className="w-4 h-4 text-[#55EFC4]" /> : <Share2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
                      </button>
                      <Link to={`/results/${s.session_id}`} className="btn-secondary !py-1.5 !px-3 text-xs">Pregled</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Multiplayer history */}
        {tab === 'multi' && (
          multiHistory.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <Swords className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-bold mb-2">Još nisi igrao/la multiplayer</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Izazovi prijatelje!</p>
              <Link to="/multiplayer" className="btn-primary inline-flex items-center gap-2">Multiplayer</Link>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {multiHistory.map((m, i) => {
                const shareText = `Odigrao/la sam ${MODE_LABELS[m.mode] || 'multiplayer'} na Kreševo Kviz!\n${m.i_won ? '🏆 Pobijedio/la sam!' : '💪 Dobra igra!'} ${m.my_score} bodova\n${window.location.origin}/multiplayer`;
                const topPlayers = [...(m.players || [])].sort((a, b) => b.score - a.score).slice(0, 3);
                return (
                  <div key={i} className="glass-card rounded-2xl p-4"
                    style={{ border: m.i_won ? '1px solid rgba(85,239,196,0.3)' : '1px solid var(--glass-border)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                        style={{ background: m.i_won ? 'rgba(85,239,196,0.15)' : 'var(--glass-bg)' }}>
                        {m.i_won ? '🏆' : '⚔️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{MODE_LABELS[m.mode] || m.mode}</span>
                          {m.i_won && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(85,239,196,0.15)', color: '#55EFC4' }}>Pobjeda</span>}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {m.played_at ? new Date(m.played_at).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          {' · '}{m.question_count} pitanja
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-['Nunito'] text-lg font-black" style={{ color: 'var(--primary)' }}>{m.my_score}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>bodova</p>
                        </div>
                        <button onClick={() => shareEntry(shareText, `m${i}`)}
                          className="p-2 rounded-xl hover:opacity-70 transition-opacity" title="Podijeli">
                          {copiedId === `m${i}` ? <Copy className="w-4 h-4 text-[#55EFC4]" /> : <Share2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
                        </button>
                      </div>
                    </div>
                    {/* Player results */}
                    <div className="flex gap-2 flex-wrap">
                      {topPlayers.map((p, pi) => (
                        <div key={pi} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                          <span>{pi === 0 ? '🥇' : pi === 1 ? '🥈' : '🥉'}</span>
                          <Link to={`/profile/${p.username}`} className="font-medium hover:underline"
                            style={{ color: p.username === user?.username ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {p.username}
                          </Link>
                          <span style={{ color: 'var(--text-secondary)' }}>{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
