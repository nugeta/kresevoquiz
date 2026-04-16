import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, ArrowRight, Loader2, Play, X } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

import { Calculator, Globe, Lightbulb } from 'lucide-react';
const iconMap = { BookOpen, Calculator, Globe, Lightbulb };
const isEmoji = (str) => str && !str.match(/^[A-Za-z]/);

const CategoriesPage = () => {
  usePageTitle('Kategorije');
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [expandedParent, setExpandedParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mix');

  // Separate parents and children
  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId && c.question_count > 0);

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(r => {
        const all = r.data.filter(c => c.question_count > 0 || !c.parent_id);
        setCategories(all);
      })
      .catch(() => setError('Greška pri učitavanju kategorija'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="categories-loading">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="categories-error">
        <div className="text-center">
          <p style={{ color: 'var(--error)' }} className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="categories-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Odaberi Kategoriju
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="max-w-xl mx-auto">
            Izaberi područje znanja koje želiš testirati i započni kviz!
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl" data-testid="no-categories">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nema dostupnih kategorija</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {/* Mix card — always first */}
            <button
              onClick={() => { setSelected({ id: 'mix', name: '🎲 Mix', icon: '🎲', color: '#A29BFE', question_count: 999, description: 'Nasumična pitanja iz svih kategorija' }); setQuestionCount(10); }}
              className="group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 text-left"
              style={{ background: isDark ? 'rgba(20,20,35,0.7)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(162,155,254,0.3)', boxShadow: '0 4px 24px rgba(162,155,254,0.15)' }}
            >
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #A29BFE, #6C5CE7)' }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0" style={{ background: 'rgba(162,155,254,0.2)' }}>
                    <span className="text-2xl">🎲</span>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all mt-1" style={{ color: '#A29BFE' }} />
                </div>
                <h3 className="text-xl font-bold mb-2">Mix</h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  Nasumična pitanja iz svih kategorija — iznenadi se!
                </p>
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(162,155,254,0.2)', color: '#A29BFE' }}>
                  Sve kategorije
                </span>
              </div>
            </button>
            {parents.map((category) => {
              const themeColor = category.color || '#8AB4F8';
              const emoji = isEmoji(category.icon);
              const IconComponent = !emoji ? (iconMap[category.icon] || BookOpen) : null;
              const children = getChildren(category.id);
              const hasChildren = children.length > 0;
              const isExpanded = expandedParent === category.id;
              const totalQuestions = hasChildren ? children.reduce((sum, c) => sum + c.question_count, 0) : category.question_count;

              return (
                <div key={category.id} className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (hasChildren) { setExpandedParent(isExpanded ? null : category.id); }
                      else { setSelected(category); setQuestionCount(Math.min(10, category.question_count)); }
                    }}
                    disabled={!hasChildren && category.question_count === 0}
                    className="group cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: isDark ? 'rgba(20,20,35,0.7)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: `1px solid ${themeColor}30`, boxShadow: `0 4px 24px ${themeColor}15` }}
                    data-testid={`category-card-${category.id}`}
                  >
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0" style={{ background: `${themeColor}20` }}>
                          {emoji ? <span className="text-2xl">{category.icon}</span> : <IconComponent className="w-7 h-7" style={{ color: themeColor }} />}
                        </div>
                        {hasChildren ? <span className="text-lg mt-1">{isExpanded ? '▲' : '▼'}</span> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all mt-1" style={{ color: themeColor }} />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{category.description || 'Testiraj svoje znanje iz ove kategorije'}</p>
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                        {hasChildren ? `${children.length} tema · ${totalQuestions} pitanja` : category.question_count === 0 ? 'Nema pitanja' : `${category.question_count} pitanja`}
                      </span>
                    </div>
                  </button>

                  {hasChildren && isExpanded && (
                    <div className="flex flex-col gap-2 pl-4 animate-fade-in">
                      <button onClick={() => { setSelected({ ...category, question_count: totalQuestions }); setQuestionCount(Math.min(10, totalQuestions)); }}
                        className="rounded-2xl p-3 text-left transition-all hover:scale-[1.02] flex items-center gap-3"
                        style={{ background: `${themeColor}15`, border: `1px solid ${themeColor}30` }}>
                        <span className="text-lg">📚</span>
                        <div><p className="font-semibold text-sm">Sve — {category.name}</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{totalQuestions} pitanja</p></div>
                      </button>
                      {children.map(child => (
                        <button key={child.id} onClick={() => { setSelected(child); setQuestionCount(Math.min(10, child.question_count)); }}
                          className="rounded-2xl p-3 text-left transition-all hover:scale-[1.02] flex items-center gap-3"
                          style={{ background: isDark ? 'rgba(20,20,35,0.5)' : 'rgba(255,255,255,0.4)', border: `1px solid ${themeColor}20` }}>
                          <span className="text-lg">{isEmoji(child.icon) ? child.icon : '📖'}</span>
                          <div><p className="font-semibold text-sm">{child.name}</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{child.question_count} pitanja</p></div>
                          <ArrowRight className="w-4 h-4 ml-auto shrink-0" style={{ color: themeColor }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Question count modal — outside ternary */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelected(null)}>
            <div className="glass-strong rounded-3xl p-8 max-w-sm w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{isEmoji(selected.icon) ? selected.icon : '📚'}</span>
                  <div>
                    <h3 className="font-['Nunito'] text-xl font-bold">{selected.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selected.id === 'mix' ? 'Sve kategorije' : `${selected.question_count} dostupnih pitanja`}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:opacity-70 transition-opacity">
                  <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Broj pitanja</label>
                  <span className="font-['Nunito'] text-2xl font-black" style={{ color: selected.color }}>{questionCount}</span>
                </div>
                <input type="range" min={5} max={selected.id === 'mix' ? 20 : Math.min(20, selected.question_count)} step={5}
                  value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {[5, 10, 15, 20].filter(n => n <= selected.question_count).map(n => <span key={n}>{n}</span>)}
                </div>
              </div>
              {/* Difficulty filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Težina</label>
                <div className="grid grid-cols-4 gap-2">
                  {[['mix','🎲','Mix'],['easy','🟢','Lako'],['medium','🟡','Srednje'],['hard','🔴','Teško']].map(([val, emoji, label]) => (
                    <button key={val} onClick={() => setDifficulty(val)}
                      className="py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: difficulty === val ? `${selected.color}25` : 'var(--glass-bg)', border: `2px solid ${difficulty === val ? selected.color : 'transparent'}`, color: difficulty === val ? selected.color : 'var(--text-secondary)' }}>
                      {emoji}<br />{label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { navigate(`/quiz/${selected.id}?count=${questionCount}&difficulty=${difficulty}`); setSelected(null); }}
                className="btn-primary w-full flex items-center justify-center gap-2 !py-4"
                style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)` }}>
                <Play className="w-5 h-5" /> Započni Kviz
              </button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 glass-card rounded-3xl p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-xl font-bold mb-3">
            Kako funkcionira kviz?
          </h3>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Svaka kategorija sadrži pitanja različitih tipova: višestruki izbor, točno/netočno i odabir jednog odgovora.
            Svako pitanje ima vremensko ograničenje. Brži odgovori donose bonus bodove!
            Prijavljeni korisnici mogu pratiti svoje rezultate i natjecati se na rang listi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
