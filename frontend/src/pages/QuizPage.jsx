import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

// ── Animated score counter ──────────────────────────────────────────────────
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

// ── Streak fire particles ───────────────────────────────────────────────────
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

// ── Race track progress ─────────────────────────────────────────────────────
function RaceTrack({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="relative h-10 mb-8 flex items-center">
      {/* Track */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #8AB4F8, #55EFC4)',
              boxShadow: '0 0 8px rgba(138,180,248,0.6)',
            }}
          />
        </div>
        {/* Finish flag */}
        <span className="absolute right-0 text-lg -top-1">🏁</span>
      </div>

      {/* Runner — SVG stick figure */}
      <div
        className="absolute transition-all duration-700 ease-out"
        style={{ left: `calc(${pct}% - 16px)`, top: '-2px' }}
      >
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
          {/* Head */}
          <circle cx="16" cy="7" r="5" fill="#8AB4F8" />
          {/* Body */}
          <line x1="16" y1="12" x2="16" y2="26" stroke="#8AB4F8" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Arms — animated swing */}
          <line x1="16" y1="16" x2="8" y2="22" stroke="#55EFC4" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 16 16;15 16 16;0 16 16;-15 16 16;0 16 16" dur="0.5s" repeatCount="indefinite"/>
          </line>
          <line x1="16" y1="16" x2="24" y2="22" stroke="#55EFC4" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 16 16;-15 16 16;0 16 16;15 16 16;0 16 16" dur="0.5s" repeatCount="indefinite"/>
          </line>
          {/* Legs */}
          <line x1="16" y1="26" x2="10" y2="36" stroke="#8AB4F8" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 16 26;20 16 26;0 16 26;-20 16 26;0 16 26" dur="0.5s" repeatCount="indefinite"/>
          </line>
          <line x1="16" y1="26" x2="22" y2="36" stroke="#8AB4F8" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 16 26;-20 16 26;0 16 26;20 16 26;0 16 26" dur="0.5s" repeatCount="indefinite"/>
          </line>
        </svg>
      </div>
    </div>
  );
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator({ value, correctAnswer }) {
  if (!value) return null;
  const len = value.trim().length;
  const targetLen = correctAnswer ? correctAnswer.trim().length : 0;

  // Rough proximity: how close is the length
  const ratio = targetLen > 0 ? Math.min(len / targetLen, 1) : 0;
  const color = ratio > 0.8 ? '#55EFC4' : ratio > 0.4 ? '#FDCB6E' : '#8AB4F8';

  return (
    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
              animation: `typingBounce 1s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span>{len} znakova</span>
      {targetLen > 0 && (
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${ratio * 100}%`, background: color }}
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

  useEffect(() => {
    if (window.Tawk_API?.hideWidget) window.Tawk_API.hideWidget();
    return () => { if (window.Tawk_API?.showWidget) window.Tawk_API.showWidget(); };
  }, []);
  
  const [sessionId, setSessionId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
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
  // flash state for ambient bg
  const [bgFlash, setBgFlash] = useState(null); // 'correct' | 'wrong' | 'partial'
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Inject keyframe animations once
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
            question_count: parseInt(searchParams.get('count') || '10'),
            difficulty: searchParams.get('difficulty') || 'mix'
          },
          { withCredentials: true }
        );
        setSessionId(response.data.session_id);
        setCategoryName(response.data.category_name);
        setTotalQuestions(response.data.total_questions);
        setQuestionNumber(response.data.current_question);
        setCurrentQuestion(response.data.question);
        setTimeLeft(response.data.question.time_limit);
        startTimeRef.current = Date.now();
      } catch (err) {
        setError(err.response?.data?.detail || 'Greška pri pokretanju kviza');
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
    if (currentQuestion.question_type === 'multiple_choice') {
      setSelectedOptions(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitAnswer = useCallback(async (isTimeout = false) => {
    if (submitting || isAnswered) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const isUpis = currentQuestion?.question_type === 'upis';
    try {
      const response = await axios.post(
        `${API_URL}/api/quiz/${sessionId}/answer`,
        {
          question_id: currentQuestion.id,
          selected_option_ids: isTimeout || isUpis ? [] : selectedOptions,
          text_answer: isUpis && !isTimeout ? textAnswer : null,
          time_taken: timeTaken
        },
        { withCredentials: true }
      );
      setIsAnswered(true);
      setAnswerResult(response.data);
      setScore(response.data.total_score);
      setStreak(prev => response.data.is_correct ? prev + 1 : 0);

      // Ambient flash
      const isPartial = response.data.upis_ratio != null && response.data.upis_ratio < 0.9;
      setBgFlash(response.data.is_correct ? (isPartial ? 'partial' : 'correct') : 'wrong');
      setTimeout(() => setBgFlash(null), 700);

      if (response.data.is_last_question) {
        setTimeout(() => navigate(`/results/${sessionId}`), 2000);
      }
    } catch (err) {
      setError('Greška pri slanju odgovora');
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, currentQuestion, selectedOptions, submitting, isAnswered, navigate, textAnswer]);

  const handleNextQuestion = () => {
    if (!answerResult?.next_question) return;
    setCurrentQuestion(answerResult.next_question);
    setQuestionNumber(answerResult.current_question);
    setTotalQuestions(answerResult.total_questions);
    setTimeLeft(answerResult.next_question.time_limit);
    setSelectedOptions([]);
    setTextAnswer('');
    setIsAnswered(false);
    setAnswerResult(null);
    startTimeRef.current = Date.now();
  };

  const getOptionClass = (optionId) => {
    if (!isAnswered) return selectedOptions.includes(optionId) ? 'selected' : '';
    const isCorrect = answerResult?.correct_option_ids?.includes(optionId);
    const wasSelected = selectedOptions.includes(optionId);
    if (isCorrect) return 'correct';
    if (wasSelected && !isCorrect) return 'incorrect';
    return '';
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return '#55EFC4';
    if (timeLeft > 10) return '#FDCB6E';
    return '#d63031';
  };

  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (timeLeft / (currentQuestion?.time_limit || 30)) * circumference;

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="quiz-loading">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AB4F8] mx-auto mb-4" />
        <p className="text-[#636E72]">Učitavanje kviza...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4" data-testid="quiz-error">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-[#d63031] mx-auto mb-4" />
        <h2 className="font-['Nunito'] text-xl font-bold mb-2">Greška</h2>
        <p className="text-[#636E72] mb-6">{error}</p>
        <button onClick={() => navigate('/categories')} className="btn-primary">Natrag na kategorije</button>
      </div>
    </div>
  );

  // Ambient bg flash colors
  const flashStyle = bgFlash === 'correct'
    ? { boxShadow: 'inset 0 0 80px rgba(0,184,148,0.18)' }
    : bgFlash === 'partial'
    ? { boxShadow: 'inset 0 0 80px rgba(253,203,110,0.18)' }
    : bgFlash === 'wrong'
    ? { boxShadow: 'inset 0 0 80px rgba(214,48,49,0.18)' }
    : {};

  return (
    <div
      className="min-h-screen pt-24 pb-12 px-4 transition-all duration-500"
      style={flashStyle}
      data-testid="quiz-page"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <p className="text-sm text-[#636E72] mb-1">{categoryName}</p>
            <h2 className="font-['Nunito'] text-xl font-bold">
              Pitanje {questionNumber} / {totalQuestions}
            </h2>
          </div>
          <div className="timer-circle" data-testid="quiz-timer">
            <svg width="80" height="80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
              <circle cx="40" cy="40" r="35" fill="none" stroke={getTimerColor()} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="progress" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-['Nunito'] text-xl font-bold" style={{ color: getTimerColor() }}>{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Race track progress */}
        <RaceTrack current={questionNumber} total={totalQuestions} />

        {/* Score + streak */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative glass-card rounded-2xl px-6 py-3 inline-flex items-center gap-2 overflow-visible">
            <FireParticles streak={streak} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bodovi:</span>
            <span
              key={score}
              className="font-['Nunito'] text-xl font-bold text-[#8AB4F8] score-pop"
              data-testid="quiz-score"
            >
              <AnimatedScore value={score} />
            </span>
          </div>
          {streak >= 2 && (
            <div className="glass-card rounded-2xl px-4 py-3 inline-flex items-center gap-2 animate-fade-in" style={{ border: '1px solid #FDCB6E50' }}>
              <span className="text-lg">🔥</span>
              <span className="font-bold text-sm text-[#FDCB6E]">{streak} zaredom!</span>
            </div>
          )}
        </div>

        {/* Question Card */}
        <div className="glass-strong rounded-3xl p-8 mb-8 animate-fade-in-up">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-[#8AB4F8]/20 text-[#8AB4F8] font-medium">
              {currentQuestion.question_type === 'multiple_choice' && 'Višestruki izbor'}
              {currentQuestion.question_type === 'single_choice' && 'Odaberi jedan'}
              {currentQuestion.question_type === 'true_false' && 'Točno / Netočno'}
              {currentQuestion.question_type === 'upis' && 'Upiši odgovor'}
            </span>
            {currentQuestion.difficulty && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                background: currentQuestion.difficulty === 'easy' ? 'rgba(85,239,196,0.2)' : currentQuestion.difficulty === 'hard' ? 'rgba(255,118,117,0.2)' : 'rgba(253,203,110,0.2)',
                color: currentQuestion.difficulty === 'easy' ? '#55EFC4' : currentQuestion.difficulty === 'hard' ? '#FF7675' : '#FDCB6E'
              }}>
                {currentQuestion.difficulty === 'easy' ? 'Lako' : currentQuestion.difficulty === 'hard' ? 'Teško' : 'Srednje'}
              </span>
            )}
            {currentQuestion.question_type === 'multiple_choice' && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>(odaberi više odgovora)</span>
            )}
          </div>
          <h3 className="font-['Nunito'] text-xl sm:text-2xl font-bold mb-2" data-testid="question-text">
            {currentQuestion.question_text}
          </h3>
          {currentQuestion.image_url && (
            <img src={currentQuestion.image_url} alt="question" className="mt-3 rounded-2xl max-h-48 object-cover w-full" onError={e => e.target.style.display='none'} />
          )}
          <p className="text-sm text-[#636E72]">{currentQuestion.points} bodova</p>
        </div>

        {/* Options or Upis */}
        {currentQuestion.question_type === 'upis' ? (
          <div className="mb-8">
            <textarea
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Upiši odgovor ovdje..."
              className="glass-input min-h-[100px] text-base resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && textAnswer.trim()) { e.preventDefault(); handleSubmitAnswer(false); } }}
              autoFocus
            />
            {/* Typing indicator — only shown before answering */}
            {!isAnswered && (
              <TypingIndicator value={textAnswer} correctAnswer={null} />
            )}
            {isAnswered && answerResult?.correct_answer && (
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(85,239,196,0.1)', border: '1px solid rgba(85,239,196,0.3)' }}>
                <span className="font-semibold" style={{ color: '#55EFC4' }}>Točan odgovor: </span>
                <span>{answerResult.correct_answer}</span>
                {answerResult.upis_ratio != null && answerResult.upis_ratio < 1 && answerResult.upis_ratio > 0 && (
                  <span className="ml-2 text-xs" style={{ color: '#FDCB6E' }}>({Math.round(answerResult.upis_ratio * 100)}% točnosti)</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 stagger-children mb-8">
            {(currentQuestion.options || []).map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isAnswered}
                className={`quiz-option w-full text-left flex items-center gap-4 ${getOptionClass(option.id)}`}
                data-testid={`option-${index}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedOptions.includes(option.id) ? 'bg-[#8AB4F8] text-white' : ''
                } ${isAnswered && answerResult?.correct_option_ids?.includes(option.id) ? 'bg-[#00b894] text-white' : ''}
                  ${isAnswered && selectedOptions.includes(option.id) && !answerResult?.correct_option_ids?.includes(option.id) ? 'bg-[#d63031] text-white' : ''}`}
                style={!selectedOptions.includes(option.id) && !(isAnswered && answerResult?.correct_option_ids?.includes(option.id)) && !(isAnswered && selectedOptions.includes(option.id)) ? { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' } : {}}
                >
                  {isAnswered ? (
                    answerResult?.correct_option_ids?.includes(option.id) ? <CheckCircle2 className="w-5 h-5" />
                    : selectedOptions.includes(option.id) ? <XCircle className="w-5 h-5" />
                    : String.fromCharCode(65 + index)
                  ) : String.fromCharCode(65 + index)}
                </div>
                <span className="font-medium">{option.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Result feedback */}
        {isAnswered && answerResult && (
          <div className={`glass-card rounded-2xl p-6 mb-8 animate-fade-in ${
            answerResult.is_correct
              ? answerResult.upis_ratio != null && answerResult.upis_ratio < 0.9
                ? 'border-2 border-[#FDCB6E]'
                : 'border-2 border-[#00b894]'
              : 'border-2 border-[#d63031]'
          }`} data-testid="answer-feedback">
            <div className="flex items-center gap-3 mb-2">
              {answerResult.is_correct ? (
                answerResult.upis_ratio != null && answerResult.upis_ratio < 0.9 ? (
                  <><CheckCircle2 className="w-6 h-6 text-[#FDCB6E]" /><span className="font-['Nunito'] text-lg font-bold text-[#FDCB6E]">Djelomično točno!</span></>
                ) : (
                  <><CheckCircle2 className="w-6 h-6 text-[#00b894]" /><span className="font-['Nunito'] text-lg font-bold text-[#00b894]">Točno!</span></>
                )
              ) : (
                <><XCircle className="w-6 h-6 text-[#d63031]" /><span className="font-['Nunito'] text-lg font-bold text-[#d63031]">Netočno!</span></>
              )}
            </div>
            <p className="text-sm text-[#636E72]">
              {answerResult.is_correct
                ? `${answerResult.upis_ratio != null && answerResult.upis_ratio < 0.9 ? 'Djelomičan odgovor! ' : 'Odlično! '}Osvojili ste ${answerResult.points_earned} bodova.`
                : 'Nažalost, odgovor nije točan.'}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          {!isAnswered ? (
            <button
              onClick={() => handleSubmitAnswer(false)}
              disabled={(currentQuestion.question_type === 'upis' ? !textAnswer.trim() : selectedOptions.length === 0) || submitting}
              className="btn-primary flex items-center gap-2 !py-4 !px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-answer-button"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />Potvrdi Odgovor</>}
            </button>
          ) : answerResult && !answerResult.is_last_question ? (
            <button onClick={handleNextQuestion} className="btn-primary flex items-center gap-2 !py-4 !px-8" data-testid="next-question-button">
              Sljedeće Pitanje <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#8AB4F8] mx-auto mb-2" />
              <p className="text-sm text-[#636E72]">Učitavanje rezultata...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
