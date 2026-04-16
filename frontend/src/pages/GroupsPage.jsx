import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Users, Target, Zap, ArrowLeft, Crown, TrendingUp, BookOpen, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const GroupsPage = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle(groupName ? `Grupa — ${groupName}` : 'Grupe');

  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (groupName) {
      // Single group stats
      axios.get(`${API_URL}/api/groups/${encodeURIComponent(groupName)}/stats`)
        .then(r => setStats(r.data))
        .catch(() => setError('Grupa nije pronađena'))
        .finally(() => setLoading(false));
    } else {
      // All groups leaderboard
      Promise.all([
        axios.get(`${API_URL}/api/leaderboard/groups`),
        axios.get(`${API_URL}/api/leaderboard/groups/weekly`)
      ])
        .then(([lb, wlb]) => { setLeaderboard(lb.data); setWeeklyLeaderboard(wlb.data); })
        .catch(() => setError('Greška pri učitavanju'))
        .finally(() => setLoading(false));
    }
  }, [groupName]);

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Natrag</button>
      </div>
    </div>
  );

  // ── Single group view ──
  if (groupName && stats) {
    const myEntry = stats.members.find(m => m.username === user?.username);
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" /> Sve grupe
          </button>

          {/* Header card */}
          <div className="glass-strong rounded-3xl p-8 animate-fade-in-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: 'rgba(138,180,248,0.15)' }}>👥</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-['Nunito'] text-2xl font-black">{stats.group_name}</h1>
                  {stats.rank && (
                    <span className="text-sm px-3 py-1 rounded-full font-bold"
                      style={{ background: 'rgba(253,203,110,0.2)', color: '#FDCB6E' }}>
                      #{stats.rank} na ljestvici
                    </span>
                  )}
                  {myEntry && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(85,239,196,0.2)', color: '#55EFC4' }}>Tvoja grupa</span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{stats.member_count} članova</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: '#FDCB6E' }} />
                <p className="font-['Nunito'] text-2xl font-black">{stats.total_score.toLocaleString()}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ukupno bodova</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Target className="w-5 h-5 mx-auto mb-1" style={{ color: '#8AB4F8' }} />
                <p className="font-['Nunito'] text-2xl font-black">{stats.avg_score}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Prosj. bodova</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: '#55EFC4' }} />
                <p className="font-['Nunito'] text-2xl font-black">{stats.total_quizzes}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kvizova</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Users className="w-5 h-5 mx-auto mb-1" style={{ color: '#FF9FF3' }} />
                <p className="font-['Nunito'] text-2xl font-black">{stats.member_count}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Članova</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 glass">
            {[['overview', 'Pregled'], ['members', 'Članovi'], ['activity', 'Aktivnost']].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: tab === val ? 'var(--surface-solid)' : 'transparent', color: tab === val ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Top categories */}
              {stats.top_categories.length > 0 && (
                <div className="glass-card rounded-3xl p-6">
                  <h2 className="font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Omiljene kategorije
                  </h2>
                  <div className="space-y-2">
                    {stats.top_categories.map((cat, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--glass-bg)' }}>
                        <span className="text-sm font-bold w-5 text-center" style={{ color: 'var(--text-secondary)' }}>{i + 1}</span>
                        <span className="flex-1 font-medium text-sm">{cat.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cat.count}x odigrano</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{cat.avg_score} prosj.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* This week's top */}
              <div className="glass-card rounded-3xl p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: '#55EFC4' }} /> Ovaj tjedan
                </h2>
                {stats.members.filter(m => m.weekly_score > 0).length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Nema aktivnosti ovaj tjedan</p>
                ) : (
                  <div className="space-y-2">
                    {[...stats.members].filter(m => m.weekly_score > 0).sort((a, b) => b.weekly_score - a.weekly_score).slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--glass-bg)' }}>
                        <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                        <Link to={`/profile/${m.username}`} className="flex-1 font-medium text-sm hover:underline"
                          style={{ color: m.username === user?.username ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {m.username}
                        </Link>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.weekly_quizzes} kvizova</span>
                        <span className="font-['Nunito'] font-black" style={{ color: '#55EFC4' }}>{m.weekly_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members tab */}
          {tab === 'members' && (
            <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
              <h2 className="font-bold mb-4">Rang lista članova</h2>
              <div className="space-y-2">
                {stats.members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: m.username === user?.username ? 'rgba(138,180,248,0.08)' : 'var(--glass-bg)', border: m.username === user?.username ? '1px solid rgba(138,180,248,0.3)' : '1px solid var(--glass-border)' }}>
                    <span className="text-base shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                    <Link to={`/profile/${m.username}`} className="flex-1 font-medium text-sm hover:underline truncate"
                      style={{ color: m.username === user?.username ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {m.username}
                      {m.username === user?.username && <span className="ml-1 text-xs opacity-60">(Ti)</span>}
                    </Link>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{m.quizzes_taken} kvizova</span>
                    <span className="font-['Nunito'] font-black shrink-0" style={{ color: 'var(--primary)' }}>{m.total_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity tab */}
          {tab === 'activity' && (
            <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
              <h2 className="font-bold mb-4">Nedavna aktivnost</h2>
              {stats.recent_activity.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Nema nedavne aktivnosti</p>
              ) : (
                <div className="space-y-2">
                  {stats.recent_activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass-bg)' }}>
                      <Link to={`/profile/${a.username}`} className="font-medium text-sm hover:underline shrink-0" style={{ color: 'var(--primary)' }}>
                        {a.username}
                      </Link>
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{a.category_name}</span>
                      <span className="font-['Nunito'] font-black shrink-0" style={{ color: 'var(--primary)' }}>{a.score}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString('hr', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── All groups view ──
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Grupe</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Rang lista razreda i grupa</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 mb-6 glass">
          <button onClick={() => setTab('all')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === 'all' ? 'var(--surface-solid)' : 'transparent', color: tab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            🏆 Ukupno
          </button>
          <button onClick={() => setTab('weekly')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === 'weekly' ? 'var(--surface-solid)' : 'transparent', color: tab === 'weekly' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            📅 Ovaj tjedan
          </button>
        </div>

        {/* All-time leaderboard */}
        {tab === 'all' && (
          <div className="space-y-3 stagger-children">
            {leaderboard.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-bold mb-2">Nema grupa</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Grupe se postavljaju u admin panelu.</p>
              </div>
            ) : leaderboard.map((g, i) => (
              <Link key={g.group} to={`/groups/${encodeURIComponent(g.group)}`}
                className={`leaderboard-item rounded-2xl p-4 sm:p-5 flex items-center gap-4 block transition-all hover:scale-[1.01] ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${g.rank}`}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Nunito'] text-lg font-bold">👥 {g.group}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{g.members} članova · {g.avg_score} prosj. bodova</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-['Nunito'] text-2xl font-bold" style={{ color: 'var(--primary)' }}>{g.total_score.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>ukupno</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Weekly leaderboard */}
        {tab === 'weekly' && (
          <div className="space-y-3 stagger-children">
            {weeklyLeaderboard.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                <p className="font-bold mb-2">Nema aktivnosti ovaj tjedan</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Igrajte kvizove da se pojavite ovdje!</p>
              </div>
            ) : weeklyLeaderboard.map((g, i) => (
              <Link key={g.group} to={`/groups/${encodeURIComponent(g.group)}`}
                className={`leaderboard-item rounded-2xl p-4 sm:p-5 flex items-center gap-4 block transition-all hover:scale-[1.01] ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${g.rank}`}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Nunito'] text-lg font-bold">👥 {g.group}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{g.members} članova · {g.quizzes} kvizova ovaj tjedan</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-['Nunito'] text-2xl font-bold" style={{ color: '#55EFC4' }}>{g.weekly_score.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>ovaj tjedan</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
