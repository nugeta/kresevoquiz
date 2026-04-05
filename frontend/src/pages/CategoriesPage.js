import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  BookOpen, 
  Calculator, 
  Globe, 
  Lightbulb,
  ArrowRight,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  BookOpen: BookOpen,
  Calculator: Calculator,
  Globe: Globe,
  Lightbulb: Lightbulb,
};

const colorBgMap = {
  '#55EFC4': 'bg-[#55EFC4]/20',
  '#8AB4F8': 'bg-[#8AB4F8]/20',
  '#FDCB6E': 'bg-[#FDCB6E]/20',
  '#FF9FF3': 'bg-[#FF9FF3]/20',
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        setCategories(response.data);
      } catch (err) {
        setError('Greška pri učitavanju kategorija');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="categories-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#8AB4F8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="categories-error">
        <div className="text-center">
          <p className="text-[#d63031] mb-4">{error}</p>
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
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Odaberi Kategoriju
          </h1>
          <p className="text-[#636E72] max-w-xl mx-auto">
            Izaberi područje znanja koje želiš testirati i započni kviz!
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl" data-testid="no-categories">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#636E72]" />
            <p className="text-[#636E72]">Nema dostupnih kategorija</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon] || BookOpen;
              const bgClass = colorBgMap[category.color] || 'bg-[#8AB4F8]/20';
              
              return (
                <Link
                  key={category.id}
                  to={`/quiz/${category.id}`}
                  className="glass-card rounded-3xl p-6 group cursor-pointer"
                  data-testid={`category-card-${category.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent 
                        className="w-7 h-7" 
                        style={{ color: category.color }} 
                      />
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#636E72] group-hover:text-[#8AB4F8] group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="font-['Nunito'] text-xl font-bold mb-2 group-hover:text-[#8AB4F8] transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-[#636E72] text-sm mb-4 line-clamp-2">
                    {category.description || 'Testiraj svoje znanje iz ove kategorije'}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ 
                        backgroundColor: `${category.color}20`,
                        color: category.color 
                      }}
                    >
                      {category.question_count} pitanja
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 glass-card rounded-3xl p-8 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-['Nunito'] text-xl font-bold mb-3">
            Kako funkcionira kviz?
          </h3>
          <p className="text-[#636E72] text-sm max-w-2xl mx-auto leading-relaxed">
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
