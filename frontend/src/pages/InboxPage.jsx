import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertTriangle, MessageSquare, Loader2, LogIn } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const InboxPage = () => {
  usePageTitle('Inbox');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [inbox, setInbox] = useState({ warnings: [], messages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    axios.get(`${API_URL}/api/users/me/inbox`, { withCredentials: true })
      .then(r => setInbox(r.data))
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
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Prijavi se za pregled poruka.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">Prijavi se</Link>
      </div>
    </div>
  );

  const total = inbox.warnings.length + inbox.messages.length;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Inbox
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{total === 0 ? 'Nema novih poruka' : `${total} nova poruka`}</p>
        </div>

        {total === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="font-bold mb-2">Inbox je prazan</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nema upozorenja ni poruka od admina.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inbox.warnings.map((w, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
                style={{ border: '1px solid rgba(253,203,110,0.4)', background: 'rgba(253,203,110,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(253,203,110,0.2)' }}>
                  <AlertTriangle className="w-5 h-5 text-[#FDCB6E]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1 text-[#FDCB6E]">Upozorenje od admina</p>
                  <p className="text-sm">{w.message}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(w.created_at).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {inbox.messages.map((m, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
                style={{ border: '1px solid rgba(138,180,248,0.4)', background: 'rgba(138,180,248,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(138,180,248,0.2)' }}>
                  <MessageSquare className="w-5 h-5 text-[#8AB4F8]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1 text-[#8AB4F8]">Poruka od admina</p>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(m.created_at).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
