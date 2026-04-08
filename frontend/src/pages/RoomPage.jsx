import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, CheckCircle2, XCircle, Users, Play, Loader2, Trophy, Clock, ArrowRight } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const DIFF_COLORS = { easy: '#55EFC4', medium: '#FDCB6E', hard: '#FF7675' };
const DIFF_LABELS = { easy: 'Lako', medium: 'Srednje', hard: 'Teško' };

const RoomPage = () => {
  usePageTitle('Multiplayer soba');
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('lobby'); // lobby | countdown | playing | finished
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [question, setQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [qTotal, setQTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [answerResult, setAnswerResult] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const ws = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isHost = players.length > 0 && players[0]?.user_id === user?._id;

  const sendMsg = useCallback((msg) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  const wsConnected = useRef(false);

  useEffect(() => {
    if (wsConnected.current) return;
    wsConnected.current = true;

    const getToken = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/ws-token`, {
          credentials: 'include'
        });
        if (!res.ok) { setError('Prijavi se za multiplayer'); return; }
        const { token } = await res.json();

        const wsUrl = import.meta.env.VITE_BACKEND_URL
          .replace('https://', 'wss://')
          .replace('http://', 'ws://');
        const socket = new WebSocket(`${wsUrl}/ws/room/${roomCode}?token=${token}`);
        ws.current = socket;

        socket.onmessage = (e) => handleMessage(JSON.parse(e.data));
        socket.onerror = () => setError(prev => prev || 'Greška pri spajanju na sobu');
        socket.onclose = (e) => {
          if (e.code !== 1000) setError(prev => prev || 'Veza prekinuta');
        };
      } catch {
        setError('Greška pri spajanju');
      }
    };

    getToken();

    return () => {
      if (ws.current) {
        ws.current.close(1000, 'unmount');
        ws.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const handleMessage = (msg) => {
    switch (msg.type) {
      case 'room_update':
      case 'score_update':
      case 'player_left':
        setPlayers(msg.players || []);
        break;

      case 'countdown':
        setPhase('countdown');
        setCountdown(msg.seconds);
        let c = msg.seconds;
        const cd = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) clearInterval(cd);
        }, 1000);
        break;

      case 'question':
        setPhase('playing');
        setQuestion(msg.question);
        setQIndex(msg.index);
        setQTotal(msg.total);
        setTimeLeft(msg.question.time_limit);
        setSelectedOptions([]);
        setAnswerResult(null);
        setIsAnswered(false);
        startTimeRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              submitAnswer(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case 'answer_result':
        setAnswerResult(msg);
        setMyScore(msg.total_score);
        setIsAnswered(true);
        if (timerRef.current) clearInterval(timerRef.current);
        break;

      case 'player_finished':
        setMyScore(msg.score);
        break;

      case 'game_over':
        setPhase('finished');
        setResults(msg.results);
        if (timerRef.current) clearInterval(timerRef.current);
        break;

      case 'error':
        setError(msg.message);
        break;
    }
  };

  const submitAnswer = useCallback((isTimeout = false) => {
    if (isAnswered) return;
    const timeTaken = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    sendMsg({
      type: 'answer',
      selected_option_ids: isTimeout ? [] : selectedOptions,
      time_taken: timeTaken
    });
  }, [isAnswered, selectedOptions, sendMsg]);

  const selectOption = (id) => {
    if (isAnswered) return;
    if (question?.question_type === 'multiple_choice') {
      setSelectedOptions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setSelectedOptions([id]);
    }
  };

  const getOptionClass = (id) => {
    if (!isAnswered) return selectedOptions.includes(id) ? 'selected' : '';
    const correct = answerResult?.correct_option_ids?.includes(id);
    const selected = selectedOptions.includes(id);
    if (correct) return 'correct';
    if (selected && !correct) return 'incorrect';
    return '';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timerColor = timeLeft > 20 ? '#55EFC4' : timeLeft > 10 ? '#FDCB6E' : '#d63031';
  const circumference = 2 * Math.PI * 35;
  const strokeOffset = circumference - (timeLeft / (question?.time_limit || 30)) * circumference;

  if (error) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <p className="text-lg font-bold mb-4" style={{ color: 'var(--error)' }}>{error}</p>
        <button onClick={() => navigate('/multiplayer')} className="btn-primary">Natrag</button>
      </div>
    </div>
  );

  // LOBBY
  if (phase === 'lobby') return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-3xl p-8 text-center animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl font-black mb-2">Čekaonica</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Podijeli kod s prijateljem</p>

          <button onClick={copyCode} className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-8 transition-all hover:scale-105"
            style={{ background: 'var(--glass-bg)', border: '2px solid var(--primary)' }}>
            <span className="font-mono text-3xl font-black tracking-widest" style={{ color: 'var(--primary)' }}>{roomCode}</span>
            {copied ? <CheckCircle2 className="w-5 h-5 text-[#55EFC4]" /> : <Copy className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
          </button>

          <div className="space-y-3 mb-8">
            {players.map((p, i) => (
              <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--glass-bg)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: i === 0 ? 'rgba(138,180,248,0.3)' : 'rgba(85,239,196,0.3)', color: i === 0 ? '#8AB4F8' : '#55EFC4' }}>
                  {i === 0 ? '👑' : '🎮'}
                </div>
                <span className="font-medium">{p.username}</span>
                {i === 0 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(138,180,248,0.2)', color: '#8AB4F8' }}>Host</span>}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Čekanje igrača...</span>
              </div>
            )}
          </div>

          {isHost && (
            <button onClick={() => sendMsg({ type: 'start_game' })} disabled={players.length < 2}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-40">
              <Play className="w-5 h-5" /> Pokreni igru
            </button>
          )}
          {!isHost && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Čekanje da host pokrene igru...</p>}
        </div>
      </div>
    </div>
  );

  // COUNTDOWN
  if (phase === 'countdown') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <p className="text-xl mb-4" style={{ color: 'var(--text-secondary)' }}>Igra počinje za</p>
        <div className="font-['Nunito'] text-9xl font-black" style={{ color: 'var(--primary)' }}>{countdown}</div>
      </div>
    </div>
  );

  // FINISHED
  if (phase === 'finished' && results) return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-3xl p-8 text-center animate-fade-in-up">
          <div className="text-5xl mb-4">{results[0]?.user_id === user?._id ? '🏆' : '💪'}</div>
          <h1 className="font-['Nunito'] text-3xl font-black mb-6">
            {results[0]?.user_id === user?._id ? 'Pobijedio/la si!' : 'Dobra igra!'}
          </h1>
          <div className="space-y-3 mb-8">
            {results.map((r, i) => (
              <div key={r.user_id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: i === 0 ? 'rgba(253,203,110,0.15)' : 'var(--glass-bg)', border: i === 0 ? '1px solid rgba(253,203,110,0.4)' : '1px solid var(--glass-border)' }}>
                <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span className="flex-1 font-bold">{r.username}</span>
                <span className="font-['Nunito'] text-2xl font-black" style={{ color: 'var(--primary)' }}>{r.score}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/multiplayer')} className="btn-secondary flex-1">Nova igra</button>
            <button onClick={() => navigate('/categories')} className="btn-primary flex-1">Solo kviz</button>
          </div>
        </div>
      </div>
    </div>
  );

  // PLAYING
  if (phase === 'playing' && question) return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Scoreboard */}
        <div className="flex gap-3 mb-6">
          {players.map(p => (
            <div key={p.user_id} className="flex-1 glass-card rounded-2xl p-3 text-center" style={{ border: p.user_id === user?._id ? '1px solid var(--primary)' : undefined }}>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{p.username}</p>
              <p className="font-['Nunito'] text-xl font-black" style={{ color: p.user_id === user?._id ? 'var(--primary)' : 'var(--text-primary)' }}>{p.score}</p>
              <div className="h-1 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${(p.current_index / qTotal) * 100}%`, background: p.user_id === user?._id ? 'var(--primary)' : '#55EFC4' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pitanje {qIndex + 1} / {qTotal}</span>
          <div className="timer-circle w-16 h-16">
            <svg width="64" height="64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeOffset} className="progress" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-sm" style={{ color: timerColor }}>{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-[#8AB4F8]/20 text-[#8AB4F8] font-medium">
              {question.question_type === 'multiple_choice' ? 'Višestruki' : question.question_type === 'true_false' ? 'Točno/Netočno' : 'Jedan odgovor'}
            </span>
            {question.difficulty && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `${DIFF_COLORS[question.difficulty]}20`, color: DIFF_COLORS[question.difficulty] }}>
                {DIFF_LABELS[question.difficulty]}
              </span>
            )}
          </div>
          <h3 className="font-['Nunito'] text-xl font-bold">{question.question_text}</h3>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((opt, i) => (
            <button key={opt.id} onClick={() => selectOption(opt.id)} disabled={isAnswered}
              className={`quiz-option w-full text-left flex items-center gap-4 ${getOptionClass(opt.id)}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm
                ${selectedOptions.includes(opt.id) ? 'bg-[#8AB4F8] text-white' : 'bg-white/20'}
                ${isAnswered && answerResult?.correct_option_ids?.includes(opt.id) ? 'bg-[#00b894] text-white' : ''}
                ${isAnswered && selectedOptions.includes(opt.id) && !answerResult?.correct_option_ids?.includes(opt.id) ? 'bg-[#d63031] text-white' : ''}`}>
                {isAnswered
                  ? answerResult?.correct_option_ids?.includes(opt.id) ? <CheckCircle2 className="w-4 h-4" />
                    : selectedOptions.includes(opt.id) ? <XCircle className="w-4 h-4" />
                    : String.fromCharCode(65 + i)
                  : String.fromCharCode(65 + i)}
              </div>
              <span className="font-medium">{opt.text}</span>
            </button>
          ))}
        </div>

        {/* Submit */}
        {!isAnswered ? (
          <button onClick={() => submitAnswer(false)} disabled={selectedOptions.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-50">
            <CheckCircle2 className="w-5 h-5" /> Potvrdi
          </button>
        ) : (
          <div className={`glass-card rounded-2xl p-4 text-center ${answerResult?.is_correct ? 'border-[#00b894]' : 'border-[#d63031]'} border`}>
            <span className="font-bold" style={{ color: answerResult?.is_correct ? '#00b894' : '#d63031' }}>
              {answerResult?.is_correct ? `✓ Točno! +${answerResult.points_earned} bodova` : '✗ Netočno'}
            </span>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Čekanje sljedećeg pitanja...</p>
          </div>
        )}
      </div>
    </div>
  );

  return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} /></div>;
};

export default RoomPage;
