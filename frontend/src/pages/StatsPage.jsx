import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, BookOpen, HelpCircle, BarChart3, Clock, Star, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card rounded-2xl p-5 text-center">
    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
    <p className="text-2xl font-black">{value}</p>
    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

const StatsPage = () => {
  usePageTitle('Statistike');
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionStats, setQuestionStats] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryQStats, setCategoryQStats] = useState({});
  const [loadingCat, setLoadingCat] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      axios.get(`${API_URL}/api/stats/detailed`, { withCredentials: true }),
      axios.get(`${API_URL}/api/stats/question-success`, { withCredentials: true })
    ])
      .then(([r1, r2]) => { setStats(r1.data); setQuestionStats(r2.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const toggleCategory = async (catName, catId) => {
    if (expandedCategory === catName) { setExpandedCategory(null); return; }
    setExpandedCategory(catName);
    if (!categoryQStats[catId] && catId) {
      setLoadingCat(catId);
      try {
        const res = await axios.get(`${API_URL}/api/stats/category/${catId}`, { withCredentials: true });
        setCategoryQStats(prev => ({ ...prev, [catId]: res.data }));
      } catch {}
      finally { setLoadingCat(null); }
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (!stats) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Statistike</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Pregled aktivnosti i rezultata</p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 stagger-children">
          <StatCard icon={HelpCircle} label="Pitanja" value={stats.totals.questions} color="#FDCB6E" />
          <StatCard icon={BookOpen} label="Kategorije" value={stats.totals.categories} color="#8AB4F8" />
          <StatCard icon={Users} label="Korisnici" value={stats.totals.users} color="#55EFC4" />
          <StatCard icon={Trophy} label="Kvizovi" value={stats.totals.quizzes_completed} color="#FF9FF3" />
          <StatCard icon={Star} label="Prosj. bodovi" value={stats.totals.avg_score} color="#FDCB6E" />
          <StatCard icon={Zap} label="Maks. bodovi" value={stats.totals.max_score} color="#7C3AED" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top users by score */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5" style={{ color: '#FDCB6E' }} />
              <h2 className="font-bold text-lg">Top 10 — Bodovi</h2>
            </div>
            <div className="space-y-2">
              {stats.top_users.map((u, i) => (
                <div key={u.username} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-sm font-bold w-6 text-center" style={{ color: i < 3 ? '#FDCB6E' : 'var(--text-secondary)' }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-sm truncate">{u.username}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{u.total_score} bod.</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.quizzes_taken}x</span>
                </div>
              ))}
              {stats.top_users.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Nema podataka</p>}
            </div>
          </div>

          {/* Most active users */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5" style={{ color: '#55EFC4' }} />
              <h2 className="font-bold text-lg">Top 10 — Aktivnost</h2>
            </div>
            <div className="space-y-2">
              {stats.most_active.map((u, i) => (
                <div key={u.username} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-sm font-bold w-6 text-center" style={{ color: i < 3 ? '#55EFC4' : 'var(--text-secondary)' }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-sm truncate">{u.username}</span>
                  <span className="text-sm font-bold" style={{ color: '#55EFC4' }}>{u.quizzes_taken} kvizova</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.total_score} bod.</span>
                </div>
              ))}
              {stats.most_active.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Nema podataka</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category stats */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5" style={{ color: '#8AB4F8' }} />
              <h2 className="font-bold text-lg">Kategorije</h2>
            </div>
            <div className="space-y-3">
              {stats.category_stats.map((cat) => {
                const max = Math.max(...stats.category_stats.map(c => c.quizzes_played), 1);
                const pct = Math.round((cat.quizzes_played / max) * 100);
                const catId = cat.id;
                const isExpanded = expandedCategory === cat.name;
                const qStats = catId ? categoryQStats[catId] : null;
                return (
                  <div key={cat.name}>
                    <button className="w-full text-left" onClick={() => toggleCategory(cat.name, catId)}>
                      <div className="flex justify-between text-sm mb-1 items-center">
                        <span className="font-medium flex items-center gap-1">
                          {cat.name}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.quizzes_played} odigranih · {cat.question_count} pitanja</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 ml-2 space-y-2 pb-2">
                        {loadingCat === catId ? (
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <Loader2 className="w-3 h-3 animate-spin" /> Učitavanje...
                          </div>
                        ) : !qStats || qStats.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nema podataka o pitanjima</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2 text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                              <span>Pitanje</span><span className="text-center">Pokušaji</span><span className="text-right">Točnost</span>
                            </div>
                            {qStats.slice(0, 10).map((q, i) => (
                              <div key={i} className="grid grid-cols-3 gap-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <span className="truncate" title={q.question_text}>{q.question_text}</span>
                                <span className="text-center" style={{ color: 'var(--text-secondary)' }}>{q.total_attempts}</span>
                                <span className="text-right font-bold" style={{ color: q.success_rate >= 70 ? '#55EFC4' : q.success_rate >= 40 ? '#FDCB6E' : '#FF7675' }}>
                                  {q.success_rate}%
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5" style={{ color: '#FF9FF3' }} />
              <h2 className="font-bold text-lg">Nedavni kvizovi</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.recent_sessions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.username || 'Gost'}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{s.category_name}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--primary)' }}>{s.score} bod.</span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString('hr') : ''}
                  </span>
                </div>
              ))}
              {stats.recent_sessions.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Nema podataka</p>}
            </div>
          </div>
        </div>

        {/* Question success rate */}
        {questionStats.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mt-6">
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5" style={{ color: '#FF7675' }} />
              <h2 className="font-bold text-lg">Najtežih 20 pitanja</h2>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>po stopi točnih odgovora</span>
            </div>
            <div className="space-y-3">
              {questionStats.map((q, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate flex-1 mr-4">{q.question_text}</span>
                    <span className="shrink-0 font-bold" style={{ color: q.success_rate < 30 ? '#FF7675' : q.success_rate < 60 ? '#FDCB6E' : '#55EFC4' }}>
                      {q.success_rate}% ({q.correct}/{q.total_attempts})
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${q.success_rate}%`, background: q.success_rate < 30 ? '#FF7675' : q.success_rate < 60 ? '#FDCB6E' : '#55EFC4' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
