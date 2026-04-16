import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Trophy, Clock, Target, CheckCircle2, XCircle, Home,
  RotateCcw, Loader2, AlertCircle, ChevronDown, ChevronUp, Share2, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import Confetti from '../components/Confetti';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const ResultsPage = () => {
  usePageTitle('Rezultati');
  const { sessionId } = useParams();
  const { isAuthenticated, refreshUser } = useAuth();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnswer, setExpandedAnswer] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/quiz/${sessionId}/results`, { withCredentials: true })
      .then(r => { setResults(r.data); if (isAuthenticated) refreshUser(); })
      .catch(() => setError('Greška pri učitavanju rezultata'))
      .finally(() => setLoading(false));
  }, [sessionId, isAuthenticated, refreshUser]);

  const getScoreEmoji = (a) => a >= 90 ? '🏆' : a >= 70 ? '🌟' : a >= 50 ? '👍' : '💪';
  const getScoreMessage = (a) => a >= 90 ? 'Izvrsno! Ti si pravi stručnjak!' : a >= 70 ? 'Odlično! Samo tako nastavi!' : a >= 50 ? 'Dobro! Možeš još bolje!' : 'Nastavi vježbati! Uspjet ćeš!';

  const shareScore = () => {
    const text = `Upravo sam završio/la kviz "${results.category_name}" na Kreševo Kviz!\n🏆 ${results.score} bodova | ✅ ${results.correct_answers}/${results.total_questions} točnih (${results.accuracy}%)\nPokušaj i ti: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#8AB4F8]" />
    </div>
  );

  if (error || !results) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-[#d63031] mx-auto mb-4" />
        <p className="text-[#636E72] mb-6">{error}</p>
        <Link to="/categories" className="btn-primary">Natrag na kategorije</Link>
      </div>
    </div>
  );

  // Difficulty breakdown
  const diffBreakdown = results.answers.reduce((acc, a) => {
    const d = a.difficulty || 'medium';
    if (!acc[d]) acc[d] = { correct: 0, total: 0 };
    acc[d].total++;
    if (a.is_correct) acc[d].correct++;
    return acc;
  }, {});

  const diffColors = { easy: '#55EFC4', medium: '#FDCB6E', hard: '#FF7675' };
  const diffLabels = { easy: 'Lako', medium: 'Srednje', hard: 'Teško' };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="results-page">
      <Confetti active={results.accuracy === 100} />
      <div className="max-w-3xl mx-auto">

        {/* Perfect score banner */}
        {results.accuracy === 100 && (
          <div className="glass-strong rounded-3xl p-6 text-center mb-6 animate-fade-in-up" style={{ border: '2px solid #FDCB6E', background: 'rgba(253,203,110,0.08)' }}>
            <div className="text-4xl mb-2">🎉🏆🎉</div>
            <h2 className="font-['Nunito'] text-2xl font-black text-[#FDCB6E]">Savršen rezultat!</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Odgovorio/la si točno na sva pitanja. Nevjerojatno!</p>
          </div>
        )}

        {/* Score Card */}
        <div className="glass-strong rounded-3xl p-8 text-center mb-6 animate-fade-in-up">
          <div className="text-6xl mb-4">{getScoreEmoji(results.accuracy)}</div>
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">Kviz Završen!</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{results.category_name}</p>

          <div className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8AB4F8]/20 to-[#55EFC4]/20 mb-4">
            <Trophy className="w-8 h-8 text-[#FDCB6E]" />
            <span className="font-['Nunito'] text-4xl font-black text-[#8AB4F8]">{results.score}</span>
            <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>bodova</span>
          </div>

          <p className="font-['Nunito'] text-xl font-bold mb-8">{getScoreMessage(results.accuracy)}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-4">
              <Target className="w-6 h-6 text-[#8AB4F8] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{results.accuracy}%</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Točnost</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <CheckCircle2 className="w-6 h-6 text-[#00b894] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{results.correct_answers}/{results.total_questions}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Točno</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <Clock className="w-6 h-6 text-[#FDCB6E] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{results.total_time}s</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Vrijeme</p>
            </div>
          </div>

          {/* Difficulty breakdown */}
          {Object.keys(diffBreakdown).length > 1 && (
            <div className="flex gap-3 justify-center mb-6 flex-wrap">
              {Object.entries(diffBreakdown).map(([d, v]) => (
                <div key={d} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: `${diffColors[d]}20`, color: diffColors[d] }}>
                  {diffLabels[d]}: {v.correct}/{v.total}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/quiz/${results.category_id || ''}`} className="btn-primary flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" /> Probaj opet?
            </Link>
            <Link to="/categories" className="btn-secondary flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" /> Druge Kategorije
            </Link>
            <button onClick={shareScore} className="btn-secondary flex items-center justify-center gap-2">
              {copied ? <><Copy className="w-5 h-5" /> Kopirano!</> : <><Share2 className="w-5 h-5" /> Podijeli</>}
            </button>
            <Link to="/" className="btn-secondary flex items-center justify-center gap-2">
              <Home className="w-5 h-5" /> Početna
            </Link>
          </div>
        </div>

        {/* Answer Review */}
        <div className="glass-card rounded-3xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-['Nunito'] text-xl font-bold mb-4">Pregled Odgovora</h2>
          <div className="space-y-3">
            {results.answers.map((answer, index) => {
              const isOpen = expandedAnswer === index;
              return (
                <div key={index} className={`rounded-2xl overflow-hidden border transition-all ${answer.is_correct ? 'border-[#00b894]/30' : 'border-[#d63031]/30'}`}
                  style={{ background: answer.is_correct ? 'rgba(0,184,148,0.07)' : 'rgba(214,48,49,0.07)' }}>
                  
                  {/* Header row — always visible */}
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedAnswer(isOpen ? null : index)}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${answer.is_correct ? 'bg-[#00b894] text-white' : 'bg-[#d63031] text-white'}`}>
                      {answer.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Pitanje {index + 1}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {answer.is_correct ? `+${answer.points_earned} bodova` : '0 bodova'} · {answer.time_taken}s
                        {answer.difficulty && <span className="ml-2" style={{ color: diffColors[answer.difficulty] }}>· {diffLabels[answer.difficulty]}</span>}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />}
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: answer.is_correct ? 'rgba(0,184,148,0.2)' : 'rgba(214,48,49,0.2)' }}>
                      <p className="font-semibold text-sm pt-3">{answer.question_text || `Pitanje ${index + 1}`}</p>
                      <div className="space-y-1.5 mt-2">
                        {answer.all_options?.map((opt) => {
                          const wasSelected = answer.selected_option_ids?.includes(opt.id);
                          const isCorrect = answer.correct_option_ids?.includes(opt.id);
                          return (
                            <div key={opt.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                              style={{
                                background: isCorrect ? 'rgba(0,184,148,0.15)' : wasSelected ? 'rgba(214,48,49,0.15)' : 'rgba(255,255,255,0.05)',
                                border: isCorrect ? '1px solid rgba(0,184,148,0.4)' : wasSelected ? '1px solid rgba(214,48,49,0.4)' : '1px solid transparent'
                              }}>
                              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-[#00b894] shrink-0" /> : wasSelected ? <XCircle className="w-4 h-4 text-[#d63031] shrink-0" /> : <span className="w-4 h-4 shrink-0" />}
                              <span>{opt.text}</span>
                              {isCorrect && <span className="ml-auto text-xs text-[#00b894] font-medium">Točan</span>}
                              {wasSelected && !isCorrect && <span className="ml-auto text-xs text-[#d63031] font-medium">Tvoj odgovor</span>}
                            </div>
                          );
                        })}
                        {!answer.all_options && (
                          <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                            Točni odgovori: {answer.correct_option_ids?.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="glass-card rounded-3xl p-6 text-center mt-6 animate-fade-in-up">
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Prijavi se za praćenje rezultata i natjecanje na rang listi!</p>
            <Link to="/auth" className="btn-primary inline-flex items-center gap-2">Prijavi se</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
