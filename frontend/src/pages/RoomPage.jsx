import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, CheckCircle2, XCircle, Users, Play, Loader2, Trophy, Clock, ArrowRight, Eye, Bot, UserPlus, X } from 'lucide-react';
import axios from 'axios';
import usePageTitle from '../hooks/usePageTitle';

const DIFF_COLORS = { easy: '#55EFC4', medium: '#FDCB6E', hard: '#FF7675' };
const DIFF_LABELS = { easy: 'Lako', medium: 'Srednje', hard: 'Teško' };

const RoomPage = () => {
  usePageTitle('Multiplayer soba');
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [roomMode, setRoomMode] = useState('ffa');
  const [teamScores, setTeamScores] = useState({ A: 0, B: 0 });
  const [isSpectator, setIsSpectator] = useState(false);
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
  const [spectatorQuestion, setSpectatorQuestion] = useState(null);

  const ws = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isHost = players.length > 0 && players[0]?.user_id === (user?.id || user?._id);

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
        const socket = new WebSocket(`${wsUrl}/ws/room/${roomCode}`);
        ws.current = socket;

        socket.onopen = () => {
          // Send auth token as first message instead of URL param
          socket.send(JSON.stringify({ type: 'auth', token }));
        };

        socket.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          // Capture server error before connection closes
          if (msg.type === 'error') {
            setError(msg.message);
          }
          handleMessage(msg);
        };
        socket.onerror = () => setError(prev => prev || 'Greška pri spajanju na sobu');
        socket.onclose = (e) => {
          if (e.code !== 1000) setError(prev => prev || `Veza prekinuta (${e.code})`);
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
      case 'spectator_join':
        setIsSpectator(true);
        setPhase('playing');
        setPlayers(msg.players || []);
        setQTotal(msg.total_questions || 0);
        if (msg.mode) setRoomMode(msg.mode);
        if (msg.team_scores) setTeamScores(msg.team_scores);
        if (msg.current_question) setSpectatorQuestion(msg.current_question);
        break;

      case 'room_update':
      case 'score_update':
      case 'player_left':
        setPlayers(msg.players || []);
        if (msg.mode) setRoomMode(msg.mode);
        if (msg.team_scores) setTeamScores(msg.team_scores);
        if (msg.total_questions) setQTotal(msg.total_questions);
        if (msg.current_question) setSpectatorQuestion(msg.current_question);
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
        setResults(msg);
        setSpectatorQuestion(null);
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

  const addBot = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomCode}/add-bot`, {}, { withCredentials: true });
    } catch (e) { alert(e.response?.data?.detail || 'Greška'); }
  };

  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const sendInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviting(true); setInviteResult('');
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomCode}/invite`,
        { username: inviteUsername.trim() }, { withCredentials: true });
      setInviteResult(`✓ Pozivnica poslana korisniku "${inviteUsername.trim()}"`);
      setInviteUsername('');
    } catch (e) {
      setInviteResult(`✗ ${e.response?.data?.detail || 'Greška'}`);
    } finally { setInviting(false); }
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: i === 0 ? 'rgba(138,180,248,0.3)' : 'rgba(85,239,196,0.3)', color: i === 0 ? '#8AB4F8' : '#55EFC4' }}>
                  {i === 0 ? '👑' : '🎮'}
                </div>
                <span className="font-medium flex-1">
                  {p.username}
                  {p.is_bot && <span className="ml-1 text-xs opacity-50">🤖</span>}
                </span>
                {roomMode === 'teams' && p.team && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: p.team === 'A' ? 'rgba(138,180,248,0.3)' : 'rgba(85,239,196,0.3)', color: p.team === 'A' ? '#8AB4F8' : '#55EFC4' }}>
                    Tim {p.team}
                  </span>
                )}
                {roomMode === 'teams' && isHost && (
                  <div className="flex gap-1">
                    <button onClick={() => sendMsg({ type: 'assign_team', user_id: p.user_id, team: 'A' })}
                      className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(138,180,248,0.2)', color: '#8AB4F8' }}>A</button>
                    <button onClick={() => sendMsg({ type: 'assign_team', user_id: p.user_id, team: 'B' })}
                      className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{ background: 'rgba(85,239,196,0.2)', color: '#55EFC4' }}>B</button>
                  </div>
                )}
                {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(138,180,248,0.2)', color: '#8AB4F8' }}>Host</span>}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Čekanje igrača...</span>
              </div>
            )}
          </div>

          {isHost && roomMode === 'teams' && players.length >= 2 && (
            <button onClick={() => sendMsg({ type: 'auto_assign_teams' })}
              className="btn-secondary w-full mb-3 text-sm">
              🎲 Nasumično rasporedi timove
            </button>
          )}

          {isHost && (
            <button onClick={() => sendMsg({ type: 'start_game' })} disabled={players.length < 2}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-4 disabled:opacity-40">
              <Play className="w-5 h-5" /> Pokreni igru
            </button>
          )}
          {isAdmin && phase === 'lobby' && (
            <button onClick={addBot} className="btn-secondary w-full flex items-center justify-center gap-2 mt-2 text-sm">
              <Bot className="w-4 h-4" /> Dodaj test bota
            </button>
          )}
          {/* Invite a user */}
          {phase === 'lobby' && (
            <div className="mt-2">
              {!showInvite ? (
                <button onClick={() => setShowInvite(true)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <UserPlus className="w-4 h-4" /> Pozovi igrača
                </button>
              ) : (
                <div className="glass rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Pozovi korisnika</p>
                    <button onClick={() => { setShowInvite(false); setInviteResult(''); }} className="hover:opacity-70">
                      <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={inviteUsername} onChange={e => setInviteUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendInvite()}
                      placeholder="Korisničko ime..." className="glass-input !py-2 text-sm flex-1" />
                    <button onClick={sendInvite} disabled={inviting || !inviteUsername.trim()}
                      className="btn-primary !py-2 !px-3 text-sm disabled:opacity-50">
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pošalji'}
                    </button>
                  </div>
                  {inviteResult && (
                    <p className="text-xs" style={{ color: inviteResult.startsWith('✓') ? '#55EFC4' : 'var(--error)' }}>
                      {inviteResult}
                    </p>
                  )}
                </div>
              )}
            </div>
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
  if (phase === 'finished' && results) {
    const isTeams = results.mode === 'teams';
    const myResult = results.results?.find(r => r.user_id === (user?.id || user?._id));
    const iWon = isTeams
      ? results.winner_team !== 'draw' && results.winner_team === myResult?.team
      : results.results?.[0]?.user_id === (user?.id || user?._id);

    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="glass-strong rounded-3xl p-8 text-center animate-fade-in-up">
            <div className="text-5xl mb-4">{iWon ? '🏆' : isTeams && results.winner_team === 'draw' ? '🤝' : '💪'}</div>
            <h1 className="font-['Nunito'] text-3xl font-black mb-2">
              {isTeams
                ? results.winner_team === 'draw' ? 'Izjednačeno!' : `Tim ${results.winner_team} pobijedio!`
                : iWon ? 'Pobijedio/la si!' : 'Dobra igra!'}
            </h1>

            {isTeams && (
              <div className="flex gap-4 justify-center mb-6">
                {['A', 'B'].map(team => (
                  <div key={team} className="flex-1 rounded-2xl p-4"
                    style={{ background: results.winner_team === team ? (team === 'A' ? 'rgba(138,180,248,0.2)' : 'rgba(85,239,196,0.2)') : 'rgba(255,255,255,0.05)', border: `2px solid ${results.winner_team === team ? (team === 'A' ? '#8AB4F8' : '#55EFC4') : 'transparent'}` }}>
                    <p className="font-bold text-sm mb-1">Tim {team}</p>
                    <p className="font-['Nunito'] text-3xl font-black" style={{ color: team === 'A' ? '#8AB4F8' : '#55EFC4' }}>{results.team_scores?.[team]}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 mb-8">
              {results.results?.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: i === 0 ? 'rgba(253,203,110,0.15)' : 'var(--glass-bg)', border: i === 0 ? '1px solid rgba(253,203,110,0.4)' : '1px solid var(--glass-border)' }}>
                  <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                  <span className="flex-1 font-bold text-left">{r.username}</span>
                  {isTeams && r.team && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.team === 'A' ? 'rgba(138,180,248,0.2)' : 'rgba(85,239,196,0.2)', color: r.team === 'A' ? '#8AB4F8' : '#55EFC4' }}>
                      Tim {r.team}
                    </span>
                  )}
                  <span className="font-['Nunito'] text-2xl font-black" style={{ color: 'var(--primary)' }}>{r.score}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/multiplayer')} className="btn-secondary flex-1">Nova igra</button>
              <button onClick={() => navigate('/multiplayer')} className="btn-primary flex-1">Revanž? ⚔️</button>
              <button onClick={() => navigate('/categories')} className="btn-secondary flex-1">Solo kviz</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SPECTATOR VIEW
  if (isSpectator) {
    const sq = spectatorQuestion;
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center justify-center gap-2 animate-fade-in-up">
            <Eye className="w-5 h-5" style={{ color: '#FDCB6E' }} />
            <h1 className="font-['Nunito'] text-2xl font-black">Gledaš meč</h1>
            {sq && (
              <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: 'rgba(253,203,110,0.15)', color: '#FDCB6E' }}>
                Pitanje {sq.index + 1}/{sq.total}
              </span>
            )}
          </div>

          {/* Team scores (teams mode) */}
          {roomMode === 'teams' && (
            <div className="flex gap-3 animate-fade-in-up">
              {['A', 'B'].map(team => (
                <div key={team} className="flex-1 glass-card rounded-2xl p-4 text-center"
                  style={{ border: `1px solid rgba(${team === 'A' ? '138,180,248' : '85,239,196'},0.4)` }}>
                  <p className="font-bold text-sm mb-1" style={{ color: team === 'A' ? '#8AB4F8' : '#55EFC4' }}>Tim {team}</p>
                  <p className="font-['Nunito'] text-3xl font-black" style={{ color: team === 'A' ? '#8AB4F8' : '#55EFC4' }}>{teamScores[team]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Current question */}
          {sq && phase !== 'finished' && (
            <div className="glass-strong rounded-3xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(138,180,248,0.15)', color: 'var(--primary)' }}>
                  {sq.question_type === 'multiple_choice' ? 'Višestruki' : sq.question_type === 'true_false' ? 'Točno/Netočno' : 'Jedan odgovor'}
                </span>
                {sq.difficulty && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${DIFF_COLORS[sq.difficulty]}20`, color: DIFF_COLORS[sq.difficulty] }}>
                    {DIFF_LABELS[sq.difficulty]}
                  </span>
                )}
                <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{sq.points} bod.</span>
              </div>
              <p className="font-['Nunito'] text-lg font-bold mb-4">{sq.question_text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sq.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(138,180,248,0.15)', color: 'var(--primary)' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player leaderboard */}
          <div className="glass-card rounded-3xl p-5 animate-fade-in-up">
            <h2 className="font-bold mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>IGRAČI</h2>
            <div className="space-y-2">
              {sortedPlayers.map((p, i) => {
                const progress = sq ? (p.current_index / sq.total) * 100 : qTotal ? (p.current_index / qTotal) * 100 : 0;
                return (
                  <div key={p.user_id} className="p-3 rounded-xl" style={{ background: i === 0 ? 'rgba(253,203,110,0.08)' : 'var(--glass-bg)', border: `1px solid ${i === 0 ? 'rgba(253,203,110,0.3)' : 'var(--glass-border)'}` }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-base shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                      <span className="font-semibold flex-1 truncate">
                        {p.username}
                        {p.is_bot && <span className="ml-1 text-xs opacity-50">🤖</span>}
                      </span>
                      {roomMode === 'teams' && p.team && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: p.team === 'A' ? 'rgba(138,180,248,0.2)' : 'rgba(85,239,196,0.2)', color: p.team === 'A' ? '#8AB4F8' : '#55EFC4' }}>
                          Tim {p.team}
                        </span>
                      )}
                      {p.finished && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(0,184,148,0.15)', color: '#00b894' }}>✓ Gotov</span>
                      )}
                      <span className="font-['Nunito'] text-lg font-black shrink-0" style={{ color: 'var(--primary)' }}>{p.score}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: p.finished ? '#00b894' : i === 0 ? '#FDCB6E' : 'var(--primary)' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {p.current_index}/{sq?.total || qTotal || '?'} pitanja
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {phase === 'finished' && (
            <button onClick={() => window.close()} className="btn-secondary w-full">Zatvori</button>
          )}
        </div>
      </div>
    );
  }

  // PLAYING
  if (phase === 'playing' && question) return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Scoreboard */}
        {roomMode === 'teams' ? (
          <div className="flex gap-3 mb-6">
            {['A', 'B'].map(team => (
              <div key={team} className="flex-1 glass-card rounded-2xl p-3 text-center"
                style={{ border: players.find(p => p.user_id === (user?.id || user?._id))?.team === team ? '1px solid var(--primary)' : undefined }}>
                <p className="text-xs font-bold mb-1" style={{ color: team === 'A' ? '#8AB4F8' : '#55EFC4' }}>Tim {team}</p>
                <p className="font-['Nunito'] text-2xl font-black" style={{ color: team === 'A' ? '#8AB4F8' : '#55EFC4' }}>{teamScores[team]}</p>
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {players.filter(p => p.team === team).map(p => (
                    <span key={p.user_id} className="text-xs truncate max-w-[60px]" style={{ color: 'var(--text-secondary)' }}>{p.username}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {players.map(p => (
              <div key={p.user_id} className="flex-1 min-w-[80px] glass-card rounded-2xl p-3 text-center" style={{ border: p.user_id === (user?.id || user?._id) ? '1px solid var(--primary)' : undefined }}>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{p.username}</p>
                <p className="font-['Nunito'] text-xl font-black" style={{ color: p.user_id === (user?.id || user?._id) ? 'var(--primary)' : 'var(--text-primary)' }}>{p.score}</p>
                <div className="h-1 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${(p.current_index / qTotal) * 100}%`, background: p.user_id === (user?.id || user?._id) ? 'var(--primary)' : '#55EFC4' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pitanje {qIndex + 1} / {qTotal}</span>
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            <svg width="64" height="64" style={{ display: 'block' }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeOffset} className="progress"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '32px 32px' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                ${selectedOptions.includes(opt.id) ? 'bg-[#8AB4F8] text-white' : ''}
                ${isAnswered && answerResult?.correct_option_ids?.includes(opt.id) ? 'bg-[#00b894] text-white' : ''}
                ${isAnswered && selectedOptions.includes(opt.id) && !answerResult?.correct_option_ids?.includes(opt.id) ? 'bg-[#d63031] text-white' : ''}`}
              style={!selectedOptions.includes(opt.id) && !(isAnswered && answerResult?.correct_option_ids?.includes(opt.id)) && !(isAnswered && selectedOptions.includes(opt.id)) ? { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' } : {}}>
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
