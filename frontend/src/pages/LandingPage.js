import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, BookOpen, Users, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="landing-page">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className={`relative min-h-screen flex items-center justify-center overflow-hidden pt-16 ${isDark ? 'hero-dark' : 'hero-light'}`}
      >
        {/* Dark mode stars */}
        {isDark && <div className="stars" />}
        
        {/* Light mode overlay */}
        {!isDark && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#F5F8FA]" />
        )}
        
        {/* Dark mode floating particles */}
        {isDark && (
          <>
            <div className="dark-particle" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
            <div className="dark-particle" style={{ top: '60%', left: '20%', animationDelay: '1s' }} />
            <div className="dark-particle" style={{ top: '30%', right: '15%', animationDelay: '2s' }} />
            <div className="dark-particle" style={{ top: '70%', right: '25%', animationDelay: '0.5s' }} />
            <div className="dark-particle" style={{ top: '40%', left: '40%', animationDelay: '1.5s' }} />
          </>
        )}
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-1)' }} />
              <span className="text-sm font-medium">Učenje nikad nije bilo zabavnije!</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
              Školski<br />
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

        {/* Floating decorations - Light mode */}
        {!isDark && (
          <>
            <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-[#8AB4F8]/30 blur-2xl animate-float" />
            <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-[#55EFC4]/30 blur-2xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-[#FF9FF3]/30 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
          </>
        )}
        
        {/* Floating decorations - Dark mode */}
        {isDark && (
          <>
            <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full blur-3xl animate-float" style={{ background: 'rgba(124, 58, 237, 0.3)' }} />
            <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full blur-3xl animate-float" style={{ background: 'rgba(16, 185, 129, 0.2)', animationDelay: '1s' }} />
            <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full blur-3xl animate-float" style={{ background: 'rgba(236, 72, 153, 0.25)', animationDelay: '2s' }} />
          </>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" style={{ background: isDark ? 'var(--background)' : 'linear-gradient(to bottom, #F5F8FA, white)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate opacity-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
              Zašto Školski Kviz?
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Naša platforma pruža zabavan i interaktivan način učenja za sve uzraste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {/* Feature 1 */}
            <div className="glass-card rounded-3xl p-8 text-center">
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
            <div className="glass-card rounded-3xl p-8 text-center">
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
            <div className="glass-card rounded-3xl p-8 text-center">
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
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className={`glass-strong rounded-3xl p-10 md:p-16 text-center scroll-animate opacity-0 relative overflow-hidden ${isDark ? '' : ''}`}
            style={{
              backgroundImage: isDark 
                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
                : `url(https://static.prod-images.emergentagent.com/jobs/25005068-c042-4484-a657-aa5285618b54/images/d867bec7cc1514bc0b5a357f8fd9e7e0aac842d27a750d22789774810800e432.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {isDark && <div className="stars absolute inset-0 opacity-50" />}
            <div className="relative z-10">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="max-w-6xl mx-auto text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>&copy; 2026 Školski Kviz. Sva prava pridržana.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
