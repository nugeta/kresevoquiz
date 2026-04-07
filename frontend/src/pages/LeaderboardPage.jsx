import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Medal, 
  Crown,
  Star,
  User,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const LeaderboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/leaderboard`);
        setLeaderboard(response.data);
      } catch (err) {
        setError('Greška pri učitavanju rang liste');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-[#FFD700]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default:
        return <span className="font-bold text-[#636E72]">#{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="leaderboard-loading">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#8AB4F8] mx-auto mb-4" />
          <p className="text-[#636E72]">Učitavanje rang liste...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" data-testid="leaderboard-error">
        <div className="glass-card rounded-3xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[#d63031] mx-auto mb-4" />
          <h2 className="font-['Nunito'] text-xl font-bold mb-2">Greška</h2>
          <p className="text-[#636E72] mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="leaderboard-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FDCB6E]/20 mb-4">
            <Trophy className="w-8 h-8 text-[#FDCB6E]" />
          </div>
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Rang Lista
          </h1>
          <p className="text-[#636E72] max-w-xl mx-auto">
            Najbolji igrači našeg kviza. Prijavi se i osvoji svoje mjesto!
          </p>
        </div>

        {/* Current User Stats (if authenticated) */}
        {isAuthenticated && user && (
          <div className="glass-strong rounded-3xl p-6 mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#8AB4F8]/20 flex items-center justify-center">
                <User className="w-7 h-7 text-[#8AB4F8]" />
              </div>
              <div className="flex-1">
                <h3 className="font-['Nunito'] text-lg font-bold">{user.username}</h3>
                <p className="text-sm text-[#636E72]">Tvoj profil</p>
              </div>
              <div className="text-right">
                <p className="font-['Nunito'] text-2xl font-bold text-[#8AB4F8]">
                  {user.total_score}
                </p>
                <p className="text-xs text-[#636E72]">{user.quizzes_taken} kvizova</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center" data-testid="empty-leaderboard">
            <Star className="w-12 h-12 text-[#636E72] mx-auto mb-4" />
            <h3 className="font-['Nunito'] text-xl font-bold mb-2">Rang lista je prazna</h3>
            <p className="text-[#636E72]">
              Budi prvi koji će osvojiti bodove! Igraj kviz i pojavi se ovdje.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = isAuthenticated && user?.username === entry.username;
              
              return (
                <div
                  key={index}
                  className={`leaderboard-item rounded-2xl p-4 sm:p-5 flex items-center gap-4 ${getRankClass(entry.rank)} ${
                    isCurrentUser ? 'ring-2 ring-[#8AB4F8]' : ''
                  }`}
                  data-testid={`leaderboard-entry-${index}`}
                >
                  {/* Rank */}
                  <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Nunito'] text-lg font-bold truncate">
                        {entry.username}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#8AB4F8]/20 text-[#8AB4F8]">
                          Ti
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#636E72]">
                      <span>{entry.quizzes_taken} kvizova</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {entry.average_score} prosjek
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="font-['Nunito'] text-2xl font-bold text-[#8AB4F8]">
                      {entry.total_score}
                    </p>
                    <p className="text-xs text-[#636E72]">bodova</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && leaderboard.length > 0 && (
          <div className="glass-card rounded-3xl p-6 text-center mt-8 animate-fade-in-up">
            <p className="text-[#636E72] mb-4">
              Prijavi se za praćenje rezultata i natjecanje na rang listi!
            </p>
            <a href="/auth" className="btn-primary inline-flex items-center gap-2">
              Prijavi se
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
