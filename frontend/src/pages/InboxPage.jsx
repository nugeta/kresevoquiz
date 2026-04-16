import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertTriangle, MessageSquare, Loader2, LogIn, Swords, Trophy, ArrowRight } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const InboxPage = () => {
  usePageTitle('Inbox');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inbox, setInbox] = useState({ warnings: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

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

  // Combine all into one list with type
  const warnings = inbox.warnings.map(w => ({ ...w, type: 'warning' }));
  const messages = (inbox.messages || []).filter(m => m.type === 'message' || !m.type).map(m => ({ ...m, type: 'message' }));
  const invites = (inbox.messages || []).filter(m => m.type === 'room_invite' || m.type === 'tournament_invite');

  const allItems = [...warnings, ...messages, ...invites].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  const filtered = tab === 'all' ? allItems
    : tab === 'invites' ? invites
    : tab === 'warnings' ? warnings
    : messages;

  const formatDate = (d) => new Date(d).toLocaleDateString('hr', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const renderItem = (item, i) => {
    if (item.type === 'warning') return (
      <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
        style={{ border: '1px solid rgba(253,203,110,0.4)', background: 'rgba(253,203,110,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(253,203,110,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-[#FDCB6E]" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1 text-[#FDCB6E]">Upozorenje od admina</p>
          <p className="text-sm">{item.message}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.created_at)}</p>
        </div>
      </div>
    );

    if (item.type === 'message') return (
      <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
        style={{ border: '1px solid rgba(138,180,248,0.4)', background: 'rgba(138,180,248,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(138,180,248,0.2)' }}>
          <MessageSquare className="w-5 h-5 text-[#8AB4F8]" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1 text-[#8AB4F8]">Poruka od admina</p>
          <p className="text-sm">{item.message}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.created_at)}</p>
        </div>
      </div>
    );

    if (item.type === 'room_invite') return (
      <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
        style={{ border: '1px solid rgba(85,239,196,0.4)', background: 'rgba(85,239,196,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(85,239,196,0.2)' }}>
          <Swords className="w-5 h-5 text-[#55EFC4]" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1 text-[#55EFC4]">Pozivnica za meč</p>
          <p className="text-sm">{item.message}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Soba: <span className="font-mono font-bold">{item.room_code}</span>
            {item.mode && ` · ${item.mode === 'ffa' ? 'Free For All' : item.mode === 'teams' ? '2v2 Timovi' : item.mode}`}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.created_at)}</p>
        </div>
        <button onClick={() => navigate(`/multiplayer/room/${item.room_code}`)}
          className="btn-primary flex items-center gap-1 !py-2 !px-3 text-xs shrink-0">
          Pridruži se <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );

    if (item.type === 'tournament_invite') return (
      <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-fade-in-up"
        style={{ border: '1px solid rgba(253,203,110,0.4)', background: 'rgba(253,203,110,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(253,203,110,0.2)' }}>
          <Trophy className="w-5 h-5 text-[#FDCB6E]" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1 text-[#FDCB6E]">Pozivnica za turnir</p>
          <p className="text-sm">{item.message}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Turnir: <span className="font-mono font-bold">{item.tournament_id}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.created_at)}</p>
        </div>
        <button onClick={() => navigate(`/multiplayer/tournament/${item.tournament_id}`)}
          className="btn-primary flex items-center gap-1 !py-2 !px-3 text-xs shrink-0"
          style={{ background: 'linear-gradient(135deg, #FDCB6E, #F59E0B)' }}>
          Pridruži se <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );

    return null;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Inbox
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {allItems.length === 0 ? 'Nema novih poruka' : `${allItems.length} nepročitanih`}
          </p>
        </div>

        {/* Tabs */}
        {allItems.length > 0 && (
          <div className="flex rounded-2xl p-1 mb-5 glass">
            {[
              ['all', `Sve (${allItems.length})`],
              ['invites', `Pozivnice (${invites.length})`],
              ['warnings', `Upozorenja (${warnings.length})`],
              ['messages', `Poruke (${messages.length})`],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: tab === val ? 'var(--surface-solid)' : 'transparent', color: tab === val ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="font-bold mb-2">Inbox je prazan</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nema novih poruka.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => renderItem(item, i))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
