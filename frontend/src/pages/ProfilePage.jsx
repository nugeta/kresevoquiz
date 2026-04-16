import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Target, Clock, Share2, Copy, CheckCircle2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const ProfilePage = () => {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  usePageTitle(`Profil — ${username}`);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/users/${username}/profile`)
      .then(r => setProfile(r.data))
      .catch(() => setError('Korisnik nije pronađen'))
      .finally(() => setLoading(false));
  }, [username]);

  const shareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error || 'Korisnik nije pronađen'}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Natrag</button>
      </div>
    </div>
  );

  const earnedAchievements = profile.achievements.filter(a => a.earned);
  const isMe = me?.username === profile.username;
  const joinDate = new Date(profile.created_at).toLocaleDateString('hr', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity mb-2" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Natrag
        </button>

        {/* Profile card */}
        <div className="glass-strong rounded-3xl p-8 animate-fade-in-up">
          <div className="flex items-start gap-5">
            {/* Avatar — initials only, no file upload */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: '#fff' }}>
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-['Nunito'] text-2xl font-black">{profile.username}</h1>
                {isMe && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(138,180,248,0.2)', color: 'var(--primary)' }}>Ti</span>}
                {profile.group && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(85,239,196,0.2)', color: '#55EFC4' }}>👥 {profile.group}</span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Član od {joinDate}</p>
              {profile.rank && (
                <p className="text-sm mt-0.5 font-semibold" style={{ color: 'var(--primary)' }}>#{profile.rank} na rang listi</p>
              )}
            </div>
            <button onClick={shareProfile} className="p-2 rounded-xl hover:opacity-70 transition-opacity shrink-0" title="Kopiraj link profila">
              {copied ? <Copy className="w-5 h-5 text-[#55EFC4]" /> : <Share2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="glass-card rounded-2xl p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: '#FDCB6E' }} />
              <p className="font-['Nunito'] text-2xl font-black">{profile.total_score}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Bodova</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1" style={{ color: '#8AB4F8' }} />
              <p className="font-['Nunito'] text-2xl font-black">{profile.quizzes_taken}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kvizova</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: '#55EFC4' }} />
              <p className="font-['Nunito'] text-2xl font-black">{earnedAchievements.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Dostignuća</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
            <h2 className="font-bold mb-4">🏅 Dostignuća ({earnedAchievements.length}/{profile.achievements.length})</h2>
            <div className="flex flex-wrap gap-2">
              {earnedAchievements.map(a => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}
                  title={a.name}>
                  <span>{a.icon}</span>
                  <span className="font-medium" style={{ color: a.color }}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent history */}
        {profile.recent_history.length > 0 && (
          <div className="glass-card rounded-3xl p-6 animate-fade-in-up">
            <h2 className="font-bold mb-4">📋 Nedavni kvizovi</h2>
            <div className="space-y-2">
              {profile.recent_history.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass-bg)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.category_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString('hr', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-['Nunito'] font-black" style={{ color: 'var(--primary)' }}>{s.score}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.accuracy}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to leaderboard */}
        <div className="text-center">
          <Link to="/leaderboard" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4" /> Rang lista
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
