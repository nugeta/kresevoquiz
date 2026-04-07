import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Ballpit from '../components/Ballpit';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const { login, register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/categories';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (honeypot) {
      setError('Nešto je pošlo po zlu. Pokušajte ponovno.');
      return;
    }

    if (username.length < 3) {
      setError('Korisničko ime mora imati najmanje 3 znaka');
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 znakova');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Lozinke se ne podudaraju');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(username, password);
      } else {
        result = await register(username, password);
      }

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Došlo je do pogreške. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 pt-20 relative overflow-hidden"
      data-testid="auth-page"
    >
      {/* Ballpit background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Ballpit
          count={80}
          gravity={0.4}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={false}
          colors={[0x8AB4F8, 0x55EFC4, 0xFF9FF3, 0xFDCB6E, 0x7C3AED]}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
          data-testid="back-to-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Natrag na početnu
        </Link>

        <div className="glass-strong rounded-3xl p-8 animate-fade-in-up">
          <div className="flex rounded-2xl p-1 mb-8" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${isLogin
                  ? 'shadow-md'
                  : 'hover:opacity-70'
                }`}
              style={{
                background: isLogin ? 'var(--surface-solid)' : 'transparent',
                color: isLogin ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
              data-testid="login-tab"
            >
              <LogIn className="w-4 h-4 inline-block mr-2" />
              Prijava
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${!isLogin
                  ? 'shadow-md'
                  : 'hover:opacity-70'
                }`}
              style={{
                background: !isLogin ? 'var(--surface-solid)' : 'transparent',
                color: !isLogin ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
              data-testid="register-tab"
            >
              <UserPlus className="w-4 h-4 inline-block mr-2" />
              Registracija
            </button>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            {isLogin ? 'Dobrodošli natrag!' : 'Kreiraj račun'}
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            {isLogin
              ? 'Prijavi se za nastavak kvizova'
              : 'Registriraj se za praćenje rezultata'}
          </p>

          {error && (
            <div
              className="flex items-center gap-2 p-4 rounded-xl text-sm mb-6 animate-fade-in"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)'
              }}
              data-testid="auth-error"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Korisničko ime</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unesite korisničko ime"
                  className="glass-input pl-12"
                  required
                  data-testid="username-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Lozinka</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Unesite lozinku"
                  className="glass-input pl-12"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-2">Potvrdi lozinku</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Potvrdite lozinku"
                    className="glass-input pl-12"
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="auth-submit-button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Učitavanje...
                </span>
              ) : (
                isLogin ? 'Prijavi se' : 'Registriraj se'
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-secondary)' }}>
            Prijava nije obavezna za igranje kvizova.
            <br />
            Prijavljeni korisnici mogu pratiti svoje rezultate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
