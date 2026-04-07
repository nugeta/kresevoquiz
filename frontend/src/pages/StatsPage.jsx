import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, BookOpen, HelpCircle, BarChart3, Clock, Star, Zap, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card rounded-2xl p-5 text-center">
    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
    <p className="text-2xl font-black">{value}</p>
    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
  </div>
);

const StatsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    axios.get(`${API_URL}/api/stats/detailed`, { withCredentials: true })
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

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
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cat.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{cat.quizzes_played} odigranih · {cat.question_count} pitanja</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    </div>
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
      </div>
    </div>
  );
};

export default StatsPage;
