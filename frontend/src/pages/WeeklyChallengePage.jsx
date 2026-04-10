import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, Play, Loader2 } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const WeeklyChallengePage = () => {
  usePageTitle('Tjedni izazov');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/weekly-challenge`),
      axios.get(`${API_URL}/api/leaderboard/weekly-challenge`)
    ])
      .then(([c, l]) => { setChallenge(c.data); setLeaderboard(l.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startChallenge = () => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    navigate(`/quiz/weekly?count=${challenge?.question_count || 10}`);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  const daysLeft = challenge ? Math.ceil((new Date(challenge.ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass-strong rounded-3xl p-8 text-center mb-8 animate-fade-in-up"
          style={{ border: '1px solid rgba(253,203,110,0.3)', background: 'rgba(253,203,110,0.05)' }}>
          <div className="text-5xl mb-4">📅</div>
          <h1 className="font-['Nunito'] text-3xl font-black mb-2">Tjedni izazov</h1>
          <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
            Svaki tjedan nova selekcija pitanja iz svih kategorija.
          </p>
          {challenge && (
            <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(253,203,110,0.2)', color: '#FDCB6E' }}>
                📝 {challenge.question_count} pitanja
              </span>
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(255,118,117,0.2)', color: '#FF7675' }}>
                ⏰ Još {daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}
              </span>
            </div>
          )}
          <button onClick={startChallenge} className="btn-primary flex items-center justify-center gap-2 mx-auto !py-4 !px-8"
            style={{ background: 'linear-gradient(135deg, #FDCB6E, #F59E0B)' }}>
            <Play className="w-5 h-5" /> Prihvati izazov
          </button>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5" style={{ color: '#FDCB6E' }} />
            <h2 className="font-bold text-lg">Ovotjedna rang lista</h2>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Budi prvi koji će završiti ovotjedni izazov!
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                  <span className="flex-1 font-medium">{e.username}</span>
                  <span className="font-['Nunito'] font-black" style={{ color: '#FDCB6E' }}>{e.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyChallengePage;
