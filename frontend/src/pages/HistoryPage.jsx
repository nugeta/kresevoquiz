import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Clock, Target, CheckCircle2, Loader2, LogIn } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const HistoryPage = () => {
  usePageTitle('Moja povijest');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    axios.get(`${API_URL}/api/quiz/history`, { withCredentials: true })
      .then(r => setHistory(r.data))
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
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Prijavi se za pregled svoje povijesti kvizova.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">Prijavi se</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Moja povijest</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Zadnjih 20 odigranih kvizova</p>
        </div>

        {history.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="font-bold mb-2">Još nisi igrao/la nijedan kviz</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Odaberi kategoriju i započni!</p>
            <Link to="/categories" className="btn-primary inline-flex items-center gap-2">Igraj kviz</Link>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {history.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--glass-bg)' }}>
                  <Trophy className="w-6 h-6" style={{ color: 'var(--accent-1)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{s.category_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <p className="font-['Nunito'] text-xl font-black" style={{ color: 'var(--primary)' }}>{s.score}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>bodova</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.correct_answers}/{s.total_questions}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.accuracy}%</p>
                  </div>
                  <Link to={`/results/${s.session_id}`} className="btn-secondary !py-2 !px-3 text-xs">Pregled</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
