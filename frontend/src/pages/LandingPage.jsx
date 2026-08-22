import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, BookOpen, Users, Sparkles, X, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import usePageTitle from '../hooks/usePageTitle';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

const LandingPage = () => {
  usePageTitle(null);
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Show banner only on mobile, not already installed
    if (!isStandalone() && (isIOS() || isAndroid())) {
      const dismissed = sessionStorage.getItem('install-dismissed');
      if (!dismissed) setShowInstall(true);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.scroll-animate');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }} data-testid="landing-page">
      {/* Install banner for mobile */}
      {showInstall && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-fade-in-up" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="glass-strong rounded-2xl p-4 flex items-start gap-3"
            style={{ border: '1px solid var(--primary)', boxShadow: '0 8px 32px rgba(124,58,237,0.3)' }}>
            <Smartphone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-1">Instaliraj kao aplikaciju</p>
              {isIOS() ? (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Dodirni <span className="font-bold text-white">Dijeli (Share)</span> pa <span className="font-bold text-white">"Dodaj na početni zaslon"</span>
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Dodirni izbornik (⋮) u pregledniku pa <span className="font-bold text-white">"Instaliraj aplikaciju"</span>
                </p>
              )}
            </div>
            <button onClick={() => { setShowInstall(false); sessionStorage.setItem('install-dismissed', '1'); }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 animate-fade-in text-sm font-medium"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
            <Sparkles className="w-4 h-4 text-[#A29BFE]" />
            <span>Dobrodošli na Kreševo Kviz</span>
          </div>

          {/* Heading */}
          <h1 className="font-['Nunito'] text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-none animate-fade-in-up">
            Testiraj Svoje <span className="text-gradient">Znanje</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl mb-10 leading-relaxed animate-fade-in-up"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>
            Kreševo Kviz nudi zanimljiva pitanja iz raznih kategorija. Igrajte sami, natječite se s drugima i osvajajte bodove na ljestvici.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}>
            <Link to="/categories" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-base !px-8 !py-4">
              <Play className="w-5 h-5 fill-current" />
              Započni Kviz
            </Link>
            <Link to="/leaderboard" className="btn-glass flex items-center justify-center gap-2 w-full sm:w-auto text-base !px-8 !py-4">
              <Trophy className="w-5 h-5 text-[#FDCB6E]" />
              Ljestvica
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-3xl p-8 hover-scale transition-all duration-300 scroll-animate">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(138, 180, 248, 0.15)', color: '#8AB4F8' }}>
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Raznolike Kategorije</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Od opće kulture do specifičnih tema – izaberite područje koje vas najviše zanima i proširite svoje znanje.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 hover-scale transition-all duration-300 scroll-animate"
              style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(253, 203, 110, 0.15)', color: '#FDCB6E' }}>
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ljestvica Najboljih</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Pratite svoj napredak i usporedite svoje rezultate s drugim igračima iz Kreševa i šire.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 hover-scale transition-all duration-300 scroll-animate"
              style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(85, 239, 196, 0.15)', color: '#55EFC4' }}>
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Zajednica</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Postanite dio kvizaške zajednice, izazovite prijatelje i sudjelujte u redovitim kviz turnirima.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
