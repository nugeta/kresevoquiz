import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft, Key } from 'lucide-react';
import axios from 'axios';
import usePageTitle from '../hooks/usePageTitle';

const Ballpit = lazy(() => import('../components/Ballpit'));

const API_URL = import.meta.env.VITE_BACKEND_URL;

const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth < 640;

const AuthPage = () => {
  usePageTitle('Prijava');
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite') || '');
  const [inviteRequired, setInviteRequired] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [mobile] = useState(() => isMobile());

  const { login, register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/categories';

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/registration-status`)
      .then(r => setInviteRequired(r.data.invite_required))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('invite')) setIsLogin(false);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (honeypot) return;

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) { setError('Unesite korisničko ime'); return; }
    if (!trimmedPass) { setError('Unesite lozinku'); return; }
    if (trimmedUser.length < 3) { setError('Korisničko ime mora imati najmanje 3 znaka'); return; }
    if (trimmedPass.length < 6) { setError('Lozinka mora imati najmanje 6 znakova'); return; }
    if (/\s/.test(trimmedUser)) { setError('Korisničko ime ne smije sadržavati razmake'); return; }
    if (!/^[a-zA-Z0-9_\-]+$/.test(trimmedUser)) { setError('Korisničko ime smije sadržavati samo slova, brojeve, _ i -'); return; }

    if (!isLogin) {
      if (password !== confirmPassword) { setError('Lozinke se ne podudaraju'); return; }
      if (inviteRequired && !inviteCode.trim()) { setError('Unesite pozivni kod'); return; }
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await login(trimmedUser, password)
        : await register(trimmedUser, password, inviteRequired ? inviteCode.trim() : undefined);

      if (result.success) {
        navigate(from, { replace: true });
      } else if (result.banned) {
        navigate('/banned', { replace: true });
      } else {
        setError(result.error);
      }
    } catch {
      setError('Došlo je do pogreške. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  };

  // Solid styles for mobile — no backdrop-filter, no glass
  const cardStyle = mobile
    ? { background: isDark ? '#141420' : '#ffffff', border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '1.5rem', padding: '2rem' }
    : undefined;

  const inputStyle = mobile
    ? { background: isDark ? '#1e1e2e' : '#f5f5f5', border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(0,0,0,0.15)'}`, borderRadius: '0.75rem', padding: '0.75rem 1rem 0.75rem 3rem', fontSize: '1rem', color: isDark ? '#F1F5F9' : '#2D3436', width: '100%', WebkitAppearance: 'none' }
    : undefined;

  const tabActiveStyle = mobile
    ? { background: isDark ? '#7C3AED' : '#8AB4F8', color: '#ffffff', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', flex: 1 }
    : undefined;

  const tabInactiveStyle = mobile
    ? { background: 'transparent', color: isDark ? '#94A3B8' : '#636E72', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', flex: 1 }
    : undefined;

  return (
    <div
      data-testid="auth-page"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5rem 1rem 2rem', background: isDark ? '#0a0a0f' : '#F5F8FA', position: 'relative', overflowX: 'hidden' }}
    >
      {/* Ballpit — desktop only, non-interactive */}
      {!mobile && (
        <Suspense fallback={null}>
          <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <Ballpit count={60} gravity={0.4} friction={0.9975} wallBounce={0.95} followCursor={false}
              colors={[0x8AB4F8, 0x55EFC4, 0xFF9FF3, 0xFDCB6E, 0x7C3AED]} />
          </div>
        </Suspense>
      )}

      <div style={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem', color: isDark ? '#94A3B8' : '#636E72', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
          Natrag na početnu
        </Link>

        <div className={mobile ? undefined : 'glass-strong rounded-3xl p-8 animate-fade-in-up'} style={cardStyle}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', borderRadius: '1rem', padding: '0.25rem', marginBottom: '2rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <button onClick={() => { setIsLogin(true); setError(''); }}
              style={mobile ? (isLogin ? tabActiveStyle : tabInactiveStyle) : undefined}
              className={mobile ? undefined : `flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'shadow-md' : 'hover:opacity-70'}`}
              {...(!mobile && { style: { background: isLogin ? 'var(--surface-solid)' : 'transparent', color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)' } })}
              data-testid="login-tab">
              <LogIn style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
              Prijava
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); }}
              style={mobile ? (!isLogin ? tabActiveStyle : tabInactiveStyle) : undefined}
              className={mobile ? undefined : `flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'shadow-md' : 'hover:opacity-70'}`}
              {...(!mobile && { style: { background: !isLogin ? 'var(--surface-solid)' : 'transparent', color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)' } })}
              data-testid="register-tab">
              <UserPlus style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
              Registracija
            </button>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: isDark ? '#F1F5F9' : '#2D3436' }}>
            {isLogin ? 'Dobrodošli natrag!' : 'Kreiraj račun'}
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', marginBottom: '2rem', color: isDark ? '#94A3B8' : '#636E72' }}>
            {isLogin ? 'Prijavi se za nastavak kvizova' : 'Registriraj se za praćenje rezultata'}
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }} data-testid="auth-error">
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: isDark ? '#F1F5F9' : '#2D3436' }}>Korisničko ime</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: isDark ? '#94A3B8' : '#636E72', pointerEvents: 'none' }} />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Unesite korisničko ime" required autoComplete="username"
                  className={mobile ? undefined : 'glass-input pl-12'}
                  style={mobile ? inputStyle : undefined}
                  data-testid="username-input" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: isDark ? '#F1F5F9' : '#2D3436' }}>Lozinka</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: isDark ? '#94A3B8' : '#636E72', pointerEvents: 'none' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Unesite lozinku" required autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={mobile ? undefined : 'glass-input pl-12'}
                  style={mobile ? inputStyle : undefined}
                  data-testid="password-input" />
              </div>
            </div>

            {/* Confirm password */}
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: isDark ? '#F1F5F9' : '#2D3436' }}>Potvrdi lozinku</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: isDark ? '#94A3B8' : '#636E72', pointerEvents: 'none' }} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Potvrdite lozinku" required autoComplete="new-password"
                    className={mobile ? undefined : 'glass-input pl-12'}
                    style={mobile ? inputStyle : undefined}
                    data-testid="confirm-password-input" />
                </div>
              </div>
            )}

            {/* Invite code */}
            {!isLogin && inviteRequired && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: isDark ? '#F1F5F9' : '#2D3436' }}>Pozivni kod</label>
                <div style={{ position: 'relative' }}>
                  <Key style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: isDark ? '#94A3B8' : '#636E72', pointerEvents: 'none' }} />
                  <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Unesite pozivni kod" required
                    className={mobile ? undefined : 'glass-input pl-12 uppercase tracking-widest'}
                    style={mobile ? { ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.1em' } : undefined} />
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: isDark ? '#94A3B8' : '#636E72' }}>
                  Nemaš pozivni kod? Kontaktiraj admina putem chata.
                </p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} data-testid="auth-submit-button"
              className={mobile ? undefined : 'btn-primary w-full !py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed'}
              style={mobile ? {
                marginTop: '1rem', padding: '1rem', borderRadius: '9999px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#555' : (isDark ? '#7C3AED' : '#8AB4F8'),
                color: '#ffffff', fontWeight: 700, fontSize: '1rem', width: '100%', opacity: loading ? 0.7 : 1,
                WebkitTapHighlightColor: 'transparent'
              } : undefined}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Učitavanje...
                </span>
              ) : (isLogin ? 'Prijavi se' : 'Registriraj se')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1.5rem', color: isDark ? '#94A3B8' : '#636E72' }}>
            Prijava nije obavezna za igranje kvizova.<br />
            Prijavljeni korisnici mogu pratiti svoje rezultate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
