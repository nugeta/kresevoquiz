import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BookOpen, 
  ArrowRight, 
  Globe, 
  Film, 
  Music, 
  Tv, 
  Sparkles, 
  Compass, 
  Award,
  Layers,
  FlaskConical,
  Palette,
  Briefcase,
  Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import usePageTitle from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const iconMap = {
  BookOpen,
  Globe,
  Film,
  Music,
  Tv,
  Sparkles,
  Compass,
  Award,
  Layers,
  FlaskConical,
  Palette,
  Briefcase,
};

const isEmoji = (str) => {
  if (!str) return false;
  return /\p{Emoji}/u.test(str) && !/[a-zA-Z0-9]/.test(str);
};

const CategoriesPage = () => {
  usePageTitle('Kategorije');
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedParent, setExpandedParent] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data);
      } catch (err) {
        console.error('Greška pri dohvaćanju kategorija:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => String(c.parent_id) === String(parentId));

  const startDirectQuiz = (catId) => {
    navigate(`/quiz/${catId}?mode=endless`);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-['Nunito'] text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Odaberi <span className="text-gradient">Kategoriju</span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Jednim klikom uskoči u kviz i odgovaraj na pitanja vlastitim tempom.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-3xl p-6 h-48 skeleton" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl" data-testid="no-categories">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nema dostupnih kategorija</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Mix Card — Instant Endless Mix */}
            <div className="self-start">
              <button
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
                  const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
                  e.currentTarget.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
                }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                onClick={() => startDirectQuiz('mix')}
                className="w-full group cursor-pointer rounded-3xl overflow-hidden text-left transition-all duration-300"
                style={{ 
                  background: isDark ? 'rgba(20,20,35,0.75)' : 'rgba(255,255,255,0.65)', 
                  backdropFilter: 'blur(16px)', 
                  border: '1px solid rgba(162,155,254,0.3)', 
                  boxShadow: '0 4px 24px rgba(162,155,254,0.15)', 
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease' 
                }}
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
            </div>

            {/* Parent Categories & Sub-Themes */}
            {parents.map((category) => {
              const themeColor = category.color || '#8AB4F8';
              const emoji = isEmoji(category.icon);
              const IconComponent = !emoji ? (iconMap[category.icon] || BookOpen) : null;
              const children = getChildren(category.id || category._id);
              const hasChildren = children.length > 0;
              const isExpanded = expandedParent === (category.id || category._id);

              return (
                <div key={category.id || category._id} className="flex flex-col gap-2 self-start">
                  <button
                    onMouseMove={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
                      const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
                      e.currentTarget.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
                    }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                    onClick={() => {
                      if (hasChildren) {
                        setExpandedParent(isExpanded ? null : (category.id || category._id));
                      } else {
                        startDirectQuiz(category.id || category._id);
                      }
                    }}
                    className="w-full group cursor-pointer rounded-3xl overflow-hidden text-left"
                    style={{ 
                      background: isDark ? 'rgba(20,20,35,0.75)' : 'rgba(255,255,255,0.65)', 
                      backdropFilter: 'blur(16px)', 
                      border: `1px solid ${themeColor}30`, 
                      boxShadow: `0 4px 24px ${themeColor}15`, 
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease' 
                    }}
                    data-testid={`category-card-${category.id || category._id}`}
                  >
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0" style={{ background: `${themeColor}20` }}>
                          {emoji ? <span className="text-2xl">{category.icon}</span> : <IconComponent className="w-7 h-7" style={{ color: themeColor }} />}
                        </div>
                        {hasChildren ? (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${themeColor}20`, color: themeColor }}>
                            {children.length} {children.length === 1 ? 'tema' : 'teme'}
                            <span className="text-base ml-1">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        ) : (
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all mt-1" style={{ color: themeColor }} />
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {category.description || 'Testiraj svoje znanje iz ove kategorije'}
                      </p>
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                        {hasChildren ? `${children.length} ${children.length === 1 ? 'tema' : children.length < 5 ? 'teme' : 'tema'}` : 'Započni kviz'}
                      </span>
                    </div>
                  </button>

                  {/* Subthemes Accordion List */}
                  {hasChildren && isExpanded && (
                    <div className="flex flex-col gap-2 pl-2 animate-fade-in">
                      <button 
                        onClick={() => startDirectQuiz(category.id || category._id)}
                        className="rounded-2xl p-3.5 text-left transition-all hover:scale-[1.02] flex items-center gap-3"
                        style={{ background: `${themeColor}18`, border: `1px solid ${themeColor}35` }}
                      >
                        <span className="text-lg">📚</span>
                        <div>
                          <p className="font-semibold text-sm">Sve — {category.name}</p>
                        </div>
                        <Play className="w-4 h-4 ml-auto shrink-0" style={{ color: themeColor }} />
                      </button>
                      {children.map(child => (
                        <button 
                          key={child.id || child._id} 
                          onClick={() => startDirectQuiz(child.id || child._id)}
                          className="rounded-2xl p-3.5 text-left transition-all hover:scale-[1.02] flex items-center gap-3"
                          style={{ background: isDark ? 'rgba(20,20,35,0.6)' : 'rgba(255,255,255,0.5)', border: `1px solid ${themeColor}20` }}
                        >
                          <span className="text-lg">{isEmoji(child.icon) ? child.icon : '📖'}</span>
                          <div>
                            <p className="font-semibold text-sm">{child.name}</p>
                          </div>
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
      </div>
    </div>
  );
};

export default CategoriesPage;
