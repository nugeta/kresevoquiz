import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, CheckCircle2, Play, Loader2, Trophy, Swords, Eye } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const TournamentPage = () => {
  usePageTitle('Turnir');
  const { tournamentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [size, setSize] = useState(4);
  const [bracket, setBracket] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [myMatchRoom, setMyMatchRoom] = useState(null);

  const ws = useRef(null);
  const wsConnected = useRef(false);
  const isHost = players.length > 0 && players[0]?.username === user?.username;

  useEffect(() => {
    if (wsConnected.current) return;
    wsConnected.current = true;

    const connect = async () => {
      try {
        const res = await fetch(`/api/auth/ws-token`, { credentials: 'include' });
        if (!res.ok) { setError('Prijavi se'); return; }
        const { token } = await res.json();
        const wsUrl = window.location.origin.replace('https://', 'wss://').replace('http://', 'ws://');
        const socket = new WebSocket(`${wsUrl}/ws/tournament/${tournamentId}`);
        ws.current = socket;
        socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token }));
        socket.onmessage = (e) => handleMessage(JSON.parse(e.data));
        socket.onerror = () => setError(prev => prev || 'Greška pri spajanju');
        socket.onclose = (e) => { if (e.code !== 1000) setError(prev => prev || 'Veza prekinuta'); };
      } catch { setError('Greška pri spajanju'); }
    };
    connect();
    return () => { if (ws.current) { ws.current.close(1000); ws.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleMessage = (msg) => {
    switch (msg.type) {
      case 'tournament_update':
        setState(msg.state);
        setPlayers(msg.players || []);
        setPlayerCount(msg.player_count);
        setSize(msg.size);
        setBracket(msg.bracket || []);
        setCurrentRound(msg.current_round || 0);
        break;
      case 'match_start': {
        setBracket(msg.bracket || []);
        const myUsername = user?.username;
        if (msg.player1 === myUsername || msg.player2 === myUsername) {
          setMyMatchRoom(msg.room_code);
          // Auto-open the match in a new tab
          window.open(`/multiplayer/room/${msg.room_code}`, '_blank');
        }
        break;
      }
      case 'match_done':
        setBracket(msg.bracket || []);
        setMyMatchRoom(null);
        break;
      case 'tournament_finished':
        setState('finished');
        setWinner(msg.winner);
        setBracket(msg.bracket || []);
        break;
      case 'error':
        setError(msg.message);
        break;
    }
  };

  const sendMsg = (msg) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(tournamentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roundNames = (totalRounds, roundIdx) => {
    const fromEnd = totalRounds - 1 - roundIdx;
    if (fromEnd === 0) return 'Finale';
    if (fromEnd === 1) return 'Polufinale';
    if (fromEnd === 2) return 'Četvrtfinale';
    return `Runda ${roundIdx + 1}`;
  };

  if (error) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 text-center max-w-md">
        <p className="text-lg font-bold mb-4" style={{ color: 'var(--error)' }}>{error}</p>
        <button onClick={() => navigate('/multiplayer')} className="btn-primary">Natrag</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="font-['Nunito'] text-3xl font-black mb-1">Turnir</h1>
          <button onClick={copyCode} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mt-2 transition-all hover:scale-105"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="font-mono font-bold tracking-widest" style={{ color: 'var(--primary)' }}>{tournamentId}</span>
            {copied ? <CheckCircle2 className="w-4 h-4 text-[#55EFC4]" /> : <Copy className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
          </button>
        </div>

        {/* My match notification */}
        {myMatchRoom && (
          <div className="glass-strong rounded-3xl p-6 mb-6 text-center animate-fade-in-up"
            style={{ border: '2px solid #FDCB6E', background: 'rgba(253,203,110,0.1)' }}>
            <p className="text-lg font-bold mb-2">⚔️ Tvoj meč je otvoren u novom tabu!</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Ako se tab nije otvorio, klikni ovdje:
            </p>
            <button onClick={() => window.open(`/multiplayer/room/${myMatchRoom}`, '_blank')}
              className="btn-primary flex items-center justify-center gap-2 mx-auto">
              <Swords className="w-5 h-5" /> Otvori meč
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players list */}
          <div className="glass-card rounded-3xl p-5">
            <h2 className="font-bold mb-4">Igrači ({playerCount}/{size})</h2>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: p.eliminated ? 'rgba(214,48,49,0.1)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="text-sm">{p.eliminated ? '❌' : '✅'}</span>
                  <span className="text-sm font-medium truncate" style={{ color: p.eliminated ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: p.eliminated ? 'line-through' : 'none' }}>
                    {p.username}
                  </span>
                  {p.username === user?.username && <span className="ml-auto text-xs" style={{ color: 'var(--primary)' }}>Ti</span>}
                </div>
              ))}
              {playerCount < size && state === 'lobby' && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>
                  Čekanje još {size - playerCount} igrača...
                </p>
              )}
            </div>

            {state === 'lobby' && isHost && (
              <button onClick={() => sendMsg({ type: 'start_tournament' })}
                disabled={playerCount < 2}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-40">
                <Play className="w-4 h-4" /> Pokreni turnir
              </button>
            )}
            {state === 'lobby' && !isHost && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text-secondary)' }}>Čekanje hosta...</p>
            )}
          </div>

          {/* Bracket */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-5">
            <h2 className="font-bold mb-4">Bracket</h2>
            {bracket.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Bracket će se prikazati kada turnir počne</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {bracket.map((round, ri) => (
                  <div key={ri} className="shrink-0 min-w-[160px]">
                    <p className="text-xs font-bold mb-3 text-center" style={{ color: 'var(--primary)' }}>
                      {roundNames(bracket.length, ri)}
                    </p>
                    <div className="space-y-3">
                      {round.map((match) => (
                        <div key={match.match_id} className="rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${match.state === 'playing' ? '#FDCB6E' : 'var(--glass-border)'}`, background: match.state === 'playing' ? 'rgba(253,203,110,0.08)' : 'var(--glass-bg)' }}>
                          {match.state === 'playing' && (
                            <div className="flex items-center justify-between px-2 py-0.5" style={{ background: 'rgba(253,203,110,0.2)' }}>
                              <span className="text-xs" style={{ color: '#FDCB6E' }}>⚔️ Live</span>
                              <button
                                onClick={() => window.open(`/multiplayer/room/${match.room_code}`, '_blank')}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                                style={{ background: 'rgba(253,203,110,0.3)', color: '#FDCB6E' }}
                                title="Gledaj meč"
                              >
                                <Eye className="w-3 h-3" /> Gledaj
                              </button>
                            </div>
                          )}
                          {[match.player1, match.player2].map((name, pi) => (
                            <div key={pi} className="px-3 py-2 flex items-center gap-2"
                              style={{ background: match.winner === name ? 'rgba(85,239,196,0.1)' : 'transparent', borderTop: pi === 1 ? '1px solid var(--glass-border)' : 'none' }}>
                              <span className="text-xs">{match.winner === name ? '🏆' : match.state === 'done' ? '❌' : '•'}</span>
                              <span className="text-sm font-medium truncate" style={{ color: match.winner === name ? '#55EFC4' : name === user?.username ? 'var(--primary)' : 'var(--text-primary)' }}>
                                {name || 'TBD'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state === 'finished' && winner && (
              <div className="mt-6 text-center p-6 rounded-2xl" style={{ background: 'rgba(253,203,110,0.1)', border: '2px solid rgba(253,203,110,0.4)' }}>
                <div className="text-4xl mb-2">🏆</div>
                <p className="font-['Nunito'] text-2xl font-black" style={{ color: '#FDCB6E' }}>{winner}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Pobjednik turnira!</p>
                <button onClick={() => navigate('/multiplayer')} className="btn-primary mt-4">Novi turnir</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
