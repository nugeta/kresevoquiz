import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const AchievementsPage = () => {
  usePageTitle('Dostignuća');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    axios.get(`${API_URL}/api/achievements`, { withCredentials: true })
      .then(r => setAchievements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

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
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Prijavi se za pregled dostignuća.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">Prijavi se</Link>
      </div>
    </div>
  );

  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Dostignuća</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{earned.length} / {achievements.length} otključano</p>
          <div className="h-2 rounded-full mt-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${achievements.length ? (earned.length / achievements.length) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--primary), #55EFC4)' }} />
          </div>
        </div>

        {earned.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-lg mb-4">✅ Otključano</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
              {earned.map(a => (
                <div key={a.id} className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  style={{ border: `1px solid ${a.color}40`, background: `${a.color}08` }}>
                  <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: `${a.color}20` }}>{a.icon}</div>
                  <div>
                    <p className="font-bold" style={{ color: a.color }}>{a.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-4">🔒 Zaključano</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locked.map(a => (
                <div key={a.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 opacity-50">
                  <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0 grayscale"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>🔒</div>
                  <div>
                    <p className="font-bold">{a.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
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

export default AchievementsPage;
