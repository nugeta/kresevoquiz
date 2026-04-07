import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, BookOpen, Users, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Iridescence from '../components/Iridescence';
import usePageTitle from '../hooks/usePageTitle';

const LandingPage = () => {
  usePageTitle(null);
  const { isDark } = useTheme();
  const heroRef = useRef(null);

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
      {/* Iridescence full-page background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Iridescence speed={1.0} amplitude={0.1} mouseReact={true} />
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ zIndex: 2 }}
      >
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-1)' }} />
              <span className="text-sm font-medium">Učenje nikad nije bilo zabavnije!</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
              Kreševo<br />
              <span 
                className="text-transparent bg-clip-text"
                style={{ 
                  backgroundImage: isDark 
                    ? 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #10B981 100%)' 
                    : 'linear-gradient(135deg, #8AB4F8 0%, #55EFC4 100%)'
                }}
              >
                Kviz
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Testiraj svoje znanje kroz zabavne kvizove iz različitih predmeta.
              Natječi se s prijateljima i osvoji najbolji rezultat!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/categories"
                className="btn-primary flex items-center justify-center gap-3 text-lg !py-4 !px-8 animate-pulse-glow"
                data-testid="start-quiz-button"
              >
                <Play className="w-5 h-5" />
                Započni Kviz
              </Link>
              <Link
                to="/leaderboard"
                className="btn-secondary flex items-center justify-center gap-3 text-lg !py-4 !px-8"
                data-testid="view-leaderboard-button"
              >
                <Trophy className="w-5 h-5" />
                Pogledaj Poredak
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate opacity-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
              Zašto Kreševo Kviz?
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Naša platforma pruža zabavan i interaktivan način učenja za sve uzraste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {/* Feature 1 */}
            <div className="rounded-3xl p-8 text-center" style={{ background: isDark ? 'rgba(20,20,35,0.6)' : 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(138, 180, 248, 0.2)' }}
              >
                <BookOpen className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Razne Kategorije</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Od matematike do povijesti - odaberi kategoriju koja te zanima i testiraj svoje znanje.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl p-8 text-center" style={{ background: isDark ? 'rgba(20,20,35,0.6)' : 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(253, 203, 110, 0.2)' }}
              >
                <Trophy className="w-8 h-8" style={{ color: 'var(--accent-1)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Rang Lista</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Natječi se s drugim učenicima i osvoji mjesto na vrhu ljestvice najboljih.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl p-8 text-center" style={{ background: isDark ? 'rgba(20,20,35,0.6)' : 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(85, 239, 196, 0.2)' }}
              >
                <Users className="w-8 h-8" style={{ color: 'var(--accent-2)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Za Sve Uzraste</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Prilagođena pitanja za osnovnu i srednju školu. Učenje kroz igru!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative" style={{ zIndex: 2 }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-10 md:p-16 text-center scroll-animate opacity-0" style={{ background: isDark ? 'rgba(20,20,35,0.6)' : 'rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
              Spreman za izazov?
            </h2>
            <p className="max-w-lg mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
              Prijavi se i počni skupljati bodove. Natječi se s prijateljima i postani prvak!
            </p>
            <Link
              to="/categories"
              className="btn-primary inline-flex items-center gap-3 text-lg !py-4 !px-8"
              data-testid="cta-start-button"
            >
              <Play className="w-5 h-5" />
              Započni Sada
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t relative" style={{ borderColor: 'var(--glass-border)', zIndex: 2 }}>
        <div className="max-w-6xl mx-auto text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>&copy; 2026 Ghost Productions. Sva prava pridržana. · <Link to="/credits" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-70 transition-opacity">Zahvale</Link></p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
