import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import CardNav from "./components/CardNav";
import { Loader2 } from "lucide-react";
import "./App.css";

// Eagerly loaded — critical path pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import CategoriesPage from "./pages/CategoriesPage";

// Lazily loaded — only fetched when navigated to
const QuizPage = lazy(() => import("./pages/QuizPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const CreditsPage = lazy(() => import("./pages/CreditsPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App min-h-screen transition-colors duration-300" style={{ background: 'var(--background)' }}>
            <CardNav />
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
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/quiz/:categoryId" element={<QuizPage />} />
                <Route path="/results/:sessionId" element={<ResultsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
