import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import CardNav from "./components/CardNav";
import { Loader2, X, Megaphone, AlertTriangle, MessageSquare } from "lucide-react";
import axios from "axios";
import "./App.css";

// Eagerly loaded — critical path pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import CategoriesPage from "./pages/CategoriesPage";
import BannedPage from "./pages/BannedPage";

// Lazily loaded — only fetched when navigated to
const QuizPage = lazy(() => import("./pages/QuizPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const CreditsPage = lazy(() => import("./pages/CreditsPage"));
const MultiplayerPage = lazy(() => import("./pages/MultiplayerPage"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const TournamentPage = lazy(() => import("./pages/TournamentPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const WeeklyChallengePage = lazy(() => import("./pages/WeeklyChallengePage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
  </div>
);

const API_URL = import.meta.env.VITE_BACKEND_URL;

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed-ann') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    axios.get(`${API_URL}/api/announcements`).then(r => setAnnouncements(r.data)).catch(() => {});
  }, []);

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    sessionStorage.setItem('dismissed-ann', JSON.stringify(next));
  };

  const colors = { info: '#8AB4F8', warning: '#FDCB6E', update: '#55EFC4' };
  const icons = { info: 'ℹ️', warning: '⚠️', update: '🆕' };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 space-y-2 pointer-events-none" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {visible.map(a => (
        <div key={a.id} className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-fade-in"
          style={{ border: `1px solid ${colors[a.type] || '#8AB4F8'}40` }}>
          <span>{icons[a.type] || 'ℹ️'}</span>
          <span className="flex-1 text-sm font-medium">{a.message}</span>
          <button onClick={() => dismiss(a.id)} className="shrink-0 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App min-h-screen transition-colors duration-300" style={{ background: 'var(--background)' }}>
            <CardNav />
            <AnnouncementBanner />
            <Toaster
              position="top-center"
              toastOptions={{
                className: 'glass-strong',
                style: {
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/banned" element={<BannedPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/quiz/:categoryId" element={<QuizPage />} />
                <Route path="/results/:sessionId" element={<ResultsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/multiplayer" element={<MultiplayerPage />} />
                <Route path="/multiplayer/room/:roomCode" element={<RoomPage />} />
                <Route path="/multiplayer/tournament/:tournamentId" element={<TournamentPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/weekly" element={<WeeklyChallengePage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
