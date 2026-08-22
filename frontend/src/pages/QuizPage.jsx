import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Flag
} from 'lucide-react';

import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Animated score counter
function AnimatedScore({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    const steps = 20;
    const step = diff / steps;
    let current = prev.current;
    let i = 0;
    const id = setInterval(() => {
      i++;
      current += step;
      setDisplay(Math.round(i === steps ? value : current));
      if (i >= steps) clearInterval(id);
    }, 18);
    prev.current = value;
    return () => clearInterval(id);
  }, [value]);

  return <span>{display}</span>;
}

// Streak fire particles
function FireParticles({ streak }) {
  if (streak < 2) return null;
  const count = Math.min(streak, 6);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: count * 3 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + (i % 8) * 11}%`,
            bottom: `${-8 + (i % 3) * 4}px`,
            fontSize: `${10 + (i % 3) * 4}px`,
            animation: `fireRise ${0.8 + (i % 4) * 0.3}s ease-out infinite`,
            animationDelay: `${(i * 0.13) % 1}s`,
            opacity: 0,
          }}
        >
          {i % 3 === 0 ? '🔥' : i % 3 === 1 ? '✨' : '💫'}
        </span>
      ))}
    </div>
  );
}

// Progress bar — Fixed overlap & supports Endless mode
function RaceTrack({ current, total, onFinish, isEndless }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const gradStart = `hsl(${Math.max(150, 210 - (pct / 100) * 60)}, 90%, 70%)`;
  const gradEnd   = `hsl(${Math.max(130, 170 - (pct / 100) * 20)}, 80%, 65%)`;
  const glowColor = `hsla(180, 90%, 70%, 0.7)`;

  return (
    <div className="mb-8">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-2">
          <span>{isEndless ? `Pitanje #${current}` : `${current} / ${total}`}</span>
          {isEndless && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400 font-bold uppercase tracking-wider">
              Beskonačni mod
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isEndless && <span>{Math.round(pct)}%</span>}
          <button
            onClick={onFinish}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-red-500/20 text-red-400 hover:text-red-300"
            title="Završi kviz i spremi rezultat"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Završi</span>
          </button>
        </div>
      </div>

      {/* Track bar */}
      {!isEndless ? (
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${gradStart}, ${gradEnd})`,
              boxShadow: pct > 0 ? `0 0 ${8 + pct * 0.18}px ${glowColor}` : 'none',
            }}
          />
        </div>
      ) : (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((current % 20) / 20) * 100}%`,
              background: 'linear-gradient(90deg, #A29BFE, #7C3AED)',
            }}
          />
        </div>
      )}
    </div>
  );
}

const QuizPage = () => {
  usePageTitle('Kviz');
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEndless = searchParams.get('mode') === 'endless' || !searchParams.get('count');

  useEffect(() => {
    if (window.Tawk_API?.hideWidget) window.Tawk_API.hideWidget();
    return () => { if (window.Tawk_API?.showWidget) window.Tawk_API.showWidget(); };
  }, []);
  
  const [sessionId, setSessionId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bgFlash, setBgFlash] = useState(null);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const id = 'quiz-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes fireRise {
        0%   { transform: translateY(0) scale(1);   opacity: 0.9; }
        60%  { transform: translateY(-28px) scale(0.8); opacity: 0.6; }
        100% { transform: translateY(-48px) scale(0.4); opacity: 0; }
      }
      @keyframes typingBounce {
        0%, 80%, 100% { transform: translateY(0); }
        40%           { transform: translateY(-5px); }
      }
      @keyframes scorePopIn {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.35); }
        100% { transform: scale(1); }
      }
      .score-pop { animation: scorePopIn 0.35s ease-out; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const startQuiz = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/api/quiz/start`,
          {
            category_id: categoryId,
            question_count: isEndless ? 50 : parseInt(searchParams.get('count') || '10'),
            difficulty: searchParams.get('difficulty') || 'mix'
          },
          { withCredentials: true }
        );
        setSessionId(response.data.session_id);
        setCategoryName(response.data.category_name);
        setTotalQuestions(response.data.total_questions);
        setQuestionNumber(response.data.current_question || 1);
        setCurrentQuestion(response.data.question);
        setTimeLeft(response.data.question.time_limit || 30);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("Quiz start error:", err);
        const detail = err.response?.data?.detail;
        const msg = Array.isArray(detail)
          ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
          : (typeof detail === 'string' ? detail : 'Greška pri pokretanju kviza');
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    startQuiz();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [categoryId]);

  useEffect(() => {
    if (!currentQuestion || isAnswered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmitAnswer(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, isAnswered]);

  const handleOptionSelect = (optionId) => {
    if (isAnswered) return;
    if (currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'true_false') {
      setSelectedOptions([optionId]);
    } else if (currentQuestion.question_type === 'multiple_choice') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleFinishEarly = () => {
    if (sessionId) {
      navigate(`/results/${sessionId}`);
    } else {
      navigate('/categories');
    }
  };

  const handleSubmitAnswer = async (isTimeout = false) => {
    if (isAnswered || submitting || !currentQuestion) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.max(
      1,
      Math.min(
        currentQuestion.time_limit || 30,
        Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      )
    );

    const qType = currentQuestion.question_type;
    const isText = qType === 'text_input' || qType === 'upis';

    const answerPayload = {
      question_id: currentQuestion.id || currentQuestion._id,
      selected_option_ids: isText ? [] : (isTimeout ? [] : selectedOptions),
      text_answer: isText ? (isTimeout ? '' : textAnswer.trim()) : null,
      time_taken: isTimeout ? (currentQuestion.time_limit || 30) : timeSpent
    };

    try {
      const response = await axios.post(
        `${API_URL}/api/quiz/${sessionId}/answer`,
        answerPayload,
        { withCredentials: true }
      );

      setIsAnswered(true);
      setAnswerResult(response.data);
      setScore(response.data.total_score);

      if (response.data.is_correct) {
        setStreak(prev => prev + 1);
        setBgFlash('correct');
      } else {
        setStreak(0);
        setBgFlash('wrong');
      }
      setTimeout(() => setBgFlash(null), 700);

    } catch (err) {
      console.error("Submit answer error:", err);
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Greška pri slanju odgovora');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (answerResult?.is_last_question || !answerResult?.next_question) {
      navigate(`/results/${sessionId}`);
      return;
    }

    const nq = answerResult.next_question;
    setCurrentQuestion(nq);
    setQuestionNumber(answerResult.current_question || (questionNumber + 1));
    setTimeLeft(nq.time_limit || 30);
    setIsAnswered(false);
    setAnswerResult(null);
    setSelectedOptions([]);
    setTextAnswer('');
    startTimeRef.current = Date.now();
  };

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Učitavanje kviza...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#d63031]" />
          <h2 className="text-2xl font-bold mb-2">Greška</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{String(error)}</p>
          <button onClick={() => navigate('/categories')} className="btn-primary w-full">
            Natrag na kategorije
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${bgFlash === 'correct' ? 'bg-emerald-500/10' : bgFlash === 'wrong' ? 'bg-rose-500/10' : ''}`}>
      <div className="max-w-3xl mx-auto">
        {/* Top Progress & Controls */}
        <RaceTrack 
          current={questionNumber} 
          total={totalQuestions} 
          onFinish={handleFinishEarly} 
          isEndless={isEndless} 
        />

        {/* Score & Timer Status Bar */}
        <div className="flex items-center justify-between mb-6 glass-card rounded-2xl px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Rezultat:</span>
            <span className="font-['Nunito'] text-xl font-extrabold text-gradient">
              <AnimatedScore value={score} />
            </span>
            {streak >= 2 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 flex items-center gap-1">
                🔥 {streak}x
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : ''}`}>
            <Clock className="w-5 h-5" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden animate-fade-in">
            <FireParticles streak={streak} />
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                {currentQuestion.question_type === 'multiple_choice' ? 'Višestruki izbor' : currentQuestion.question_type === 'true_false' ? 'Točno / Netočno' : currentQuestion.question_type === 'text_input' || currentQuestion.question_type === 'upis' ? 'Upiši odgovor' : 'Odaberi jedan'}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                {currentQuestion.points} bodova
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold leading-relaxed mb-6">
              {currentQuestion.question_text}
            </h2>

            {/* Options */}
            {currentQuestion.question_type === 'text_input' || currentQuestion.question_type === 'upis' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  disabled={isAnswered}
                  placeholder="Upišite vaš odgovor..."
                  className="glass-input !py-4 !text-lg text-center font-semibold"
                  onKeyDown={e => { if (e.key === 'Enter' && textAnswer.trim()) handleSubmitAnswer(); }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  let stateClass = '';
                  if (isAnswered) {
                    if (option.is_correct) {
                      stateClass = '!border-emerald-500 !bg-emerald-500/20 text-emerald-300';
                    } else if (isSelected && !option.is_correct) {
                      stateClass = '!border-rose-500 !bg-rose-500/20 text-rose-300';
                    }
                  } else if (isSelected) {
                    stateClass = '!border-[var(--primary)] !bg-[var(--primary)]/15';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isAnswered}
                      className={`quiz-option w-full text-left flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${stateClass}`}
                    >
                      <span className="text-base font-medium">{option.text}</span>
                      {isAnswered && option.is_correct && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                      {isAnswered && isSelected && !option.is_correct && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Submit / Next Button */}
            <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              {!isAnswered ? (
                <button
                  onClick={() => handleSubmitAnswer(false)}
                  disabled={submitting || ((currentQuestion.question_type === 'text_input' || currentQuestion.question_type === 'upis') ? !textAnswer.trim() : selectedOptions.length === 0)}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-4 text-lg font-bold disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Potvrdi odgovor'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-4 text-lg font-bold"
                >
                  <span>{answerResult?.is_last_question ? 'Pogledaj rezultate' : 'Sljedeće pitanje'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
