import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle,
  Home,
  RotateCcw,
  Loader2,
  AlertCircle,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ResultsPage = () => {
  const { sessionId } = useParams();
  const { isAuthenticated, refreshUser } = useAuth();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/quiz/${sessionId}/results`, {
          withCredentials: true
        });
        setResults(response.data);
        
        // Refresh user data if authenticated (to update score)
        if (isAuthenticated) {
          refreshUser();
        }
      } catch (err) {
        setError('Greška pri učitavanju rezultata');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId, isAuthenticated, refreshUser]);

  const getScoreEmoji = (accuracy) => {
    if (accuracy >= 90) return '🏆';
    if (accuracy >= 70) return '🌟';
    if (accuracy >= 50) return '👍';
    return '💪';
  };

  const getScoreMessage = (accuracy) => {
    if (accuracy >= 90) return 'Izvrsno! Ti si pravi stručnjak!';
    if (accuracy >= 70) return 'Odlično! Samo tako nastavi!';
    if (accuracy >= 50) return 'Dobro! Možeš još bolje!';
    return 'Nastavi vježbati! Uspjet ćeš!';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="results-loading">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#8AB4F8] mx-auto mb-4" />
          <p className="text-[#636E72]">Učitavanje rezultata...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4" data-testid="results-error">
        <div className="glass-card rounded-3xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[#d63031] mx-auto mb-4" />
          <h2 className="font-['Nunito'] text-xl font-bold mb-2">Greška</h2>
          <p className="text-[#636E72] mb-6">{error}</p>
          <Link to="/categories" className="btn-primary">
            Natrag na kategorije
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="results-page">
      <div className="max-w-3xl mx-auto">
        {/* Score Card */}
        <div className="glass-strong rounded-3xl p-8 text-center mb-8 animate-fade-in-up">
          <div className="text-6xl mb-4">{getScoreEmoji(results.accuracy)}</div>
          
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">
            Kviz Završen!
          </h1>
          
          <p className="text-[#636E72] mb-6">{results.category_name}</p>

          {/* Main Score */}
          <div className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8AB4F8]/20 to-[#55EFC4]/20 mb-6">
            <Trophy className="w-8 h-8 text-[#FDCB6E]" />
            <span className="font-['Nunito'] text-4xl font-black text-[#8AB4F8]" data-testid="final-score">
              {results.score}
            </span>
            <span className="text-[#636E72] text-lg">bodova</span>
          </div>

          <p className="font-['Nunito'] text-xl font-bold text-[#2D3436] mb-8">
            {getScoreMessage(results.accuracy)}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-4">
              <Target className="w-6 h-6 text-[#8AB4F8] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold" data-testid="accuracy">
                {results.accuracy}%
              </p>
              <p className="text-xs text-[#636E72]">Točnost</p>
            </div>
            
            <div className="glass-card rounded-2xl p-4">
              <CheckCircle2 className="w-6 h-6 text-[#00b894] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold" data-testid="correct-answers">
                {results.correct_answers}/{results.total_questions}
              </p>
              <p className="text-xs text-[#636E72]">Točno</p>
            </div>
            
            <div className="glass-card rounded-2xl p-4">
              <Clock className="w-6 h-6 text-[#FDCB6E] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold" data-testid="total-time">
                {results.total_time}s
              </p>
              <p className="text-xs text-[#636E72]">Vrijeme</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/categories"
              className="btn-primary flex items-center justify-center gap-2"
              data-testid="play-again-button"
            >
              <RotateCcw className="w-5 h-5" />
              Igraj Ponovno
            </Link>
            <Link
              to="/leaderboard"
              className="btn-secondary flex items-center justify-center gap-2"
              data-testid="view-leaderboard-button"
            >
              <Trophy className="w-5 h-5" />
              Pogledaj Poredak
            </Link>
            <Link
              to="/"
              className="btn-secondary flex items-center justify-center gap-2"
              data-testid="go-home-button"
            >
              <Home className="w-5 h-5" />
              Početna
            </Link>
          </div>
        </div>

        {/* Answer Review */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-['Nunito'] text-xl font-bold mb-6">Pregled Odgovora</h2>
          
          <div className="space-y-4">
            {results.answers.map((answer, index) => (
              <div 
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  answer.is_correct 
                    ? 'bg-[#00b894]/10 border border-[#00b894]/30' 
                    : 'bg-[#d63031]/10 border border-[#d63031]/30'
                }`}
                data-testid={`answer-review-${index}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  answer.is_correct ? 'bg-[#00b894] text-white' : 'bg-[#d63031] text-white'
                }`}>
                  {answer.is_correct ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    Pitanje {index + 1}
                  </p>
                  <p className="text-xs text-[#636E72]">
                    {answer.is_correct ? `+${answer.points_earned} bodova` : '0 bodova'}
                    {' · '}
                    {answer.time_taken}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Prompt */}
        {!isAuthenticated && (
          <div className="glass-card rounded-3xl p-6 text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-[#636E72] mb-4">
              Prijavi se za praćenje rezultata i natjecanje na rang listi!
            </p>
            <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
              Prijavi se
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
