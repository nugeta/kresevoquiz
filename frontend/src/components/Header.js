import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Trophy, 
  LogIn, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Home,
  Settings
} from 'lucide-react';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
            data-testid="logo-link"
          >
            <BookOpen className="w-7 h-7 text-[#8AB4F8]" />
            <span className="font-['Nunito'] tracking-tight">Školski Kviz</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm font-medium hover:text-[#8AB4F8] transition-colors"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4" />
              Početna
            </Link>
            <Link 
              to="/categories" 
              className="flex items-center gap-2 text-sm font-medium hover:text-[#8AB4F8] transition-colors"
              data-testid="nav-categories"
            >
              <BookOpen className="w-4 h-4" />
              Kategorije
            </Link>
            <Link 
              to="/leaderboard" 
              className="flex items-center gap-2 text-sm font-medium hover:text-[#8AB4F8] transition-colors"
              data-testid="nav-leaderboard"
            >
              <Trophy className="w-4 h-4" />
              Poredak
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-sm font-medium hover:text-[#8AB4F8] transition-colors"
                data-testid="nav-admin"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-[#8AB4F8]" />
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#8AB4F8]/20">
                    {user.total_score} bodova
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center gap-2 text-sm !py-2 !px-4"
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4" />
                  Odjava
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="btn-primary flex items-center gap-2 text-sm !py-2 !px-4"
                data-testid="login-button"
              >
                <LogIn className="w-4 h-4" />
                Prijava
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-strong border-t border-white/30 animate-fade-in">
          <nav className="px-4 py-4 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-nav-home"
            >
              <Home className="w-5 h-5 text-[#8AB4F8]" />
              <span className="font-medium">Početna</span>
            </Link>
            <Link
              to="/categories"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-nav-categories"
            >
              <BookOpen className="w-5 h-5 text-[#8AB4F8]" />
              <span className="font-medium">Kategorije</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-nav-leaderboard"
            >
              <Trophy className="w-5 h-5 text-[#8AB4F8]" />
              <span className="font-medium">Poredak</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-admin"
              >
                <Settings className="w-5 h-5 text-[#8AB4F8]" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
            <div className="border-t border-white/30 pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 p-3">
                    <User className="w-5 h-5 text-[#8AB4F8]" />
                    <div>
                      <span className="font-medium block">{user.username}</span>
                      <span className="text-xs text-[#636E72]">{user.total_score} bodova</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors text-left"
                    data-testid="mobile-logout-button"
                  >
                    <LogOut className="w-5 h-5 text-[#d63031]" />
                    <span className="font-medium text-[#d63031]">Odjava</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-login-button"
                >
                  <LogIn className="w-5 h-5 text-[#8AB4F8]" />
                  <span className="font-medium">Prijava</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
