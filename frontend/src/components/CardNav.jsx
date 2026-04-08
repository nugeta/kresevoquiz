import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowUpRight, 
  BookOpen, 
  Trophy, 
  Home, 
  Settings, 
  LogIn, 
  LogOut, 
  User,
  Sun,
  Moon,
  Heart,
  BarChart3,
  Swords
} from 'lucide-react';

const CardNav = ({ className = '' }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  // Theme-based colors
  const menuColor = isDark ? '#F1F5F9' : '#2D3436';
  const buttonBgColor = isDark ? '#7C3AED' : '#8AB4F8';
  const buttonTextColor = isDark ? '#ffffff' : '#2D3436';

  // Navigation items with theme colors
  const navItems = [
    {
      label: 'Početna',
      bgColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(138, 180, 248, 0.2)',
      textColor: isDark ? '#F1F5F9' : '#2D3436',
      links: [
        { label: 'Početna stranica', href: '/', icon: Home },
        { label: 'O kvizu', href: '/#features', icon: BookOpen },
        { label: 'Zahvale', href: '/credits', icon: Heart },
      ]
    },
    {
      label: 'Kvizovi',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(85, 239, 196, 0.2)',
      textColor: isDark ? '#F1F5F9' : '#2D3436',
      links: [
        { label: 'Kategorije', href: '/categories', icon: BookOpen },
        { label: 'Rang lista', href: '/leaderboard', icon: Trophy },
        { label: 'Moja povijest', href: '/history', icon: BarChart3 },
        { label: 'Multiplayer', href: '/multiplayer', icon: Swords },
      ]
    },
    {
      label: isAuthenticated ? 'Profil' : 'Prijava',
      bgColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(253, 203, 110, 0.2)',
      textColor: isDark ? '#F1F5F9' : '#2D3436',
      links: isAuthenticated 
        ? [
            { label: `${user?.username} (${user?.total_score} bodova)`, href: '/leaderboard', icon: User },
            ...(isAdmin ? [
              { label: 'Admin panel', href: '/admin', icon: Settings },
              { label: 'Statistike', href: '/stats', icon: BarChart3 },
            ] : []),
            { label: 'Odjava', href: '#logout', icon: LogOut, onClick: logout },
          ]
        : [
            { label: 'Prijavi se', href: '/auth', icon: LogIn },
          ]
    }
  ];

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 280;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 280;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease: 'power3.out'
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, isAuthenticated, isAdmin]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // Close menu on route change
  useEffect(() => {
    if (isExpanded) {
      setIsHamburgerOpen(false);
      const tl = tlRef.current;
      if (tl) {
        tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
        tl.reverse();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  const handleLinkClick = (e, link) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
    // Handle hash scroll links
    if (link.href === '/#features') {
      e.preventDefault();
      const el = document.getElementById('features');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Not on landing page, navigate there first
        window.location.href = '/#features';
      }
    }
    // Close menu after clicking
    if (isExpanded) {
      setIsHamburgerOpen(false);
      const tl = tlRef.current;
      if (tl) {
        tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
        tl.reverse();
      }
    }
  };

  return (
    <div
      className={`card-nav-container fixed left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] z-50 top-3 md:top-5 ${className}`}
      data-testid="main-header"
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} block h-[60px] p-0 rounded-xl shadow-lg relative overflow-hidden will-change-[height] transition-colors duration-300`}
        style={{ 
          background: isDark
            ? 'rgba(10, 10, 20, 0.55)'
            : 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${isDark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.6)'}`,
          boxShadow: isDark 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Top Bar */}
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-4 z-10">
          {/* Hamburger Menu */}
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Zatvori izbornik' : 'Otvori izbornik'}
            tabIndex={0}
            data-testid="nav-hamburger"
          >
            <div
              className={`hamburger-line w-[28px] h-[2px] transition-all duration-300 ease-linear origin-center ${
                isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
              } group-hover:opacity-75`}
              style={{ backgroundColor: menuColor }}
            />
            <div
              className={`hamburger-line w-[28px] h-[2px] transition-all duration-300 ease-linear origin-center ${
                isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
              } group-hover:opacity-75`}
              style={{ backgroundColor: menuColor }}
            />
          </div>

          {/* Logo */}
          <Link 
            to="/" 
            className="logo-container flex items-center gap-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none hover:opacity-80 transition-opacity"
            data-testid="logo-link"
          >
            <BookOpen className="w-6 h-6" style={{ color: isDark ? '#7C3AED' : '#8AB4F8' }} />
            <span className="font-bold text-lg tracking-tight" style={{ color: menuColor }}>
              Kreševo Kviz
            </span>
          </Link>

          {/* Right Side - Theme Toggle + CTA */}
          <div className="flex items-center gap-3 order-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ 
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(138, 180, 248, 0.2)'
              }}
              data-testid="theme-toggle"
              aria-label={isDark ? 'Prebaci na svijetli način' : 'Prebaci na tamni način'}
            >
              {isDark ? (
                <Moon className="w-5 h-5" style={{ color: '#7C3AED' }} />
              ) : (
                <Sun className="w-5 h-5" style={{ color: '#FDCB6E' }} />
              )}
            </button>

            {/* CTA Button - Desktop */}
            <Link
              to={isAuthenticated ? "/categories" : "/auth"}
              className="hidden md:inline-flex border-0 rounded-lg px-4 items-center h-[40px] font-semibold cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              data-testid="nav-cta-button"
            >
              {isAuthenticated ? "Igraj Kviz" : "Započni"}
            </Link>
          </div>
        </div>

        {/* Expanded Content */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          } md:flex-row md:items-stretch md:gap-3`}
          aria-hidden={!isExpanded}
        >
          {navItems.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-3 md:p-4 rounded-lg min-w-0 flex-[1_1_auto] h-auto min-h-[70px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-all duration-300 hover:scale-[1.02]"
              ref={setCardRef(idx)}
              style={{ 
                backgroundColor: item.bgColor, 
                color: item.textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'}`
              }}
            >
              <div className="nav-card-label font-semibold tracking-tight text-base md:text-lg">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-1">
                {item.links?.map((lnk, i) => {
                  const IconComponent = lnk.icon || ArrowUpRight;
                  const isExternal = lnk.href.startsWith('http');
                  const LinkComponent = lnk.href.startsWith('#') ? 'button' : Link;
                  
                  return (
                    <LinkComponent
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-all duration-300 hover:opacity-75 hover:translate-x-1 text-sm md:text-base"
                      to={!lnk.href.startsWith('#') ? lnk.href : undefined}
                      href={lnk.href.startsWith('#') ? undefined : lnk.href}
                      onClick={(e) => handleLinkClick(e, lnk)}
                      style={{ color: item.textColor }}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{lnk.label}</span>
                    </LinkComponent>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
