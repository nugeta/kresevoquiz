import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, BookOpen, Users, Sparkles } from 'lucide-react';

const LandingPage = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

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
    <div className="min-h-screen" data-testid="landing-page">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{
          backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/25005068-c042-4484-a657-aa5285618b54/images/59f50ed042324382f0362433d2ebb7d4a816e046e1031b0a39f22a0a88c458ab.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#F5F8FA]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Sparkles className="w-4 h-4 text-[#FDCB6E]" />
              <span className="text-sm font-medium">Učenje nikad nije bilo zabavnije!</span>
            </div>
            
            <h1 className="font-['Nunito'] text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
              Školski<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8AB4F8] to-[#55EFC4]">
                Kviz
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-[#636E72] max-w-2xl mx-auto mb-10 leading-relaxed">
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

        {/* Floating decorations */}
        <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-[#8AB4F8]/30 blur-2xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-[#55EFC4]/30 blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-[#FF9FF3]/30 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 bg-gradient-to-b from-[#F5F8FA] to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate opacity-0">
            <h2 className="font-['Nunito'] text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
              Zašto Školski Kviz?
            </h2>
            <p className="text-[#636E72] max-w-xl mx-auto">
              Naša platforma pruža zabavan i interaktivan način učenja za sve uzraste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {/* Feature 1 */}
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#8AB4F8]/20 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-[#8AB4F8]" />
              </div>
              <h3 className="font-['Nunito'] text-xl font-bold mb-3">Razne Kategorije</h3>
              <p className="text-[#636E72] text-sm leading-relaxed">
                Od matematike do povijesti - odaberi kategoriju koja te zanima i testiraj svoje znanje.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FDCB6E]/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-[#FDCB6E]" />
              </div>
              <h3 className="font-['Nunito'] text-xl font-bold mb-3">Rang Lista</h3>
              <p className="text-[#636E72] text-sm leading-relaxed">
                Natječi se s drugim učenicima i osvoji mjesto na vrhu ljestvice najboljih.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#55EFC4]/20 flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-[#55EFC4]" />
              </div>
              <h3 className="font-['Nunito'] text-xl font-bold mb-3">Za Sve Uzraste</h3>
              <p className="text-[#636E72] text-sm leading-relaxed">
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
            className="glass-strong rounded-3xl p-10 md:p-16 text-center scroll-animate opacity-0"
            style={{
              backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/25005068-c042-4484-a657-aa5285618b54/images/d867bec7cc1514bc0b5a357f8fd9e7e0aac842d27a750d22789774810800e432.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative z-10">
              <h2 className="font-['Nunito'] text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                Spreman za izazov?
              </h2>
              <p className="text-[#636E72] max-w-lg mx-auto mb-8">
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
      <footer className="py-8 px-4 border-t border-white/50">
        <div className="max-w-6xl mx-auto text-center text-sm text-[#636E72]">
          <p>&copy; 2026 Školski Kviz. Sva prava pridržana.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
