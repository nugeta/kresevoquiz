import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  HelpCircle,
  Save,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Trophy,
  BarChart3
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'BookOpen', color: '#8AB4F8' });
  const [questionForm, setQuestionForm] = useState({
    category_id: '',
    question_text: '',
    question_type: 'single_choice',
    options: [
      { id: crypto.randomUUID(), text: '', is_correct: false },
      { id: crypto.randomUUID(), text: '', is_correct: false },
    ],
    points: 10,
    time_limit: 30
  });

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        const [catRes, questRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories`, { withCredentials: true }),
          axios.get(`${API_URL}/api/questions`, { withCredentials: true }),
          axios.get(`${API_URL}/api/stats`, { withCredentials: true })
        ]);
        setCategories(catRes.data);
        setQuestions(questRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError('Greška pri učitavanju podataka');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Category handlers
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: 'BookOpen', color: '#8AB4F8' });
    }
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/api/categories/${editingCategory.id}`, categoryForm, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/categories`, categoryForm, { withCredentials: true });
      }
      // Refresh
      const res = await axios.get(`${API_URL}/api/categories`, { withCredentials: true });
      setCategories(res.data);
      setCategoryModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    } finally {
      setSaving(false);
    }
  };

  // Question handlers
  const openQuestionModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        category_id: question.category_id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options.map(o => ({ ...o })),
        points: question.points,
        time_limit: question.time_limit
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        category_id: categories[0]?.id || '',
        question_text: '',
        question_type: 'single_choice',
        options: [
          { id: crypto.randomUUID(), text: '', is_correct: false },
          { id: crypto.randomUUID(), text: '', is_correct: false },
        ],
        points: 10,
        time_limit: 30
      });
    }
    setQuestionModalOpen(true);
  };

  const saveQuestion = async () => {
    // Validate
    if (!questionForm.category_id || !questionForm.question_text.trim()) {
      alert('Popunite sva obavezna polja');
      return;
    }
    if (questionForm.options.filter(o => o.text.trim()).length < 2) {
      alert('Dodajte barem 2 opcije');
      return;
    }
    if (!questionForm.options.some(o => o.is_correct)) {
      alert('Označite barem jedan točan odgovor');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...questionForm,
        options: questionForm.options.filter(o => o.text.trim())
      };

      if (editingQuestion) {
        await axios.put(`${API_URL}/api/questions/${editingQuestion.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/questions`, payload, { withCredentials: true });
      }
      // Refresh
      const [questRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/api/questions`, { withCredentials: true }),
        axios.get(`${API_URL}/api/categories`, { withCredentials: true })
      ]);
      setQuestions(questRes.data);
      setCategories(catRes.data);
      setQuestionModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteModal = (type, item) => {
    setDeleteTarget({ type, item });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'category') {
        await axios.delete(`${API_URL}/api/categories/${deleteTarget.item.id}`, { withCredentials: true });
        setCategories(prev => prev.filter(c => c.id !== deleteTarget.item.id));
        setQuestions(prev => prev.filter(q => q.category_id !== deleteTarget.item.id));
      } else {
        await axios.delete(`${API_URL}/api/questions/${deleteTarget.item.id}`, { withCredentials: true });
        setQuestions(prev => prev.filter(q => q.id !== deleteTarget.item.id));
        // Refresh categories to update question count
        const catRes = await axios.get(`${API_URL}/api/categories`, { withCredentials: true });
        setCategories(catRes.data);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    } finally {
      setSaving(false);
    }
  };

  // Option handlers
  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { id: crypto.randomUUID(), text: '', is_correct: false }]
    }));
  };

  const removeOption = (id) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== id)
    }));
  };

  const updateOption = (id, field, value) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map(o => o.id === id ? { ...o, [field]: value } : o)
    }));
  };

  const toggleCorrect = (id) => {
    if (questionForm.question_type === 'multiple_choice') {
      updateOption(id, 'is_correct', !questionForm.options.find(o => o.id === id).is_correct);
    } else {
      // Single selection
      setQuestionForm(prev => ({
        ...prev,
        options: prev.options.map(o => ({ ...o, is_correct: o.id === id }))
      }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" data-testid="admin-loading">
        <Loader2 className="w-10 h-10 animate-spin text-[#8AB4F8]" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4" data-testid="admin-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-['Nunito'] text-3xl sm:text-4xl font-black mb-2">
            Admin Panel
          </h1>
          <p className="text-[#636E72]">Upravljaj kategorijama i pitanjima</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger-children">
            <div className="glass-card rounded-2xl p-4 text-center">
              <BookOpen className="w-6 h-6 text-[#8AB4F8] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{stats.total_categories}</p>
              <p className="text-xs text-[#636E72]">Kategorije</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <HelpCircle className="w-6 h-6 text-[#FDCB6E] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{stats.total_questions}</p>
              <p className="text-xs text-[#636E72]">Pitanja</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Users className="w-6 h-6 text-[#55EFC4] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{stats.total_users}</p>
              <p className="text-xs text-[#636E72]">Korisnici</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Trophy className="w-6 h-6 text-[#FF9FF3] mx-auto mb-2" />
              <p className="font-['Nunito'] text-2xl font-bold">{stats.total_quizzes_completed}</p>
              <p className="text-xs text-[#636E72]">Kvizovi</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="categories" className="animate-fade-in-up">
          <TabsList className="glass mb-6">
            <TabsTrigger value="categories" className="data-[state=active]:bg-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Kategorije
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-white">
              <HelpCircle className="w-4 h-4 mr-2" />
              Pitanja
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Kategorije ({categories.length})</h2>
              <button
                onClick={() => openCategoryModal()}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
                data-testid="add-category-button"
              >
                <Plus className="w-4 h-4" />
                Nova Kategorija
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="glass-card rounded-2xl overflow-hidden">
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Nunito'] font-bold">{category.name}</h3>
                      <p className="text-sm text-[#636E72]">{category.question_count} pitanja</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        data-testid={`edit-category-${category.id}`}
                      >
                        <Edit2 className="w-4 h-4 text-[#636E72]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal('category', category); }}
                        className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors"
                        data-testid={`delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#d63031]" />
                      </button>
                      {expandedCategory === category.id ? (
                        <ChevronUp className="w-5 h-5 text-[#636E72]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#636E72]" />
                      )}
                    </div>
                  </div>
                  
                  {expandedCategory === category.id && (
                    <div className="border-t border-white/30 p-4 bg-white/30">
                      <p className="text-sm text-[#636E72] mb-3">{category.description || 'Nema opisa'}</p>
                      <div className="space-y-2">
                        {questions.filter(q => q.category_id === category.id).slice(0, 5).map((q) => (
                          <div key={q.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/40">
                            <HelpCircle className="w-4 h-4 text-[#636E72] flex-shrink-0" />
                            <span className="truncate flex-1">{q.question_text}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-[#8AB4F8]/20 text-[#8AB4F8]">
                              {q.question_type === 'multiple_choice' ? 'Više' : q.question_type === 'true_false' ? 'T/N' : 'Jedan'}
                            </span>
                          </div>
                        ))}
                        {questions.filter(q => q.category_id === category.id).length > 5 && (
                          <p className="text-xs text-[#636E72] text-center">
                            ... i još {questions.filter(q => q.category_id === category.id).length - 5} pitanja
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Pitanja ({questions.length})</h2>
              <button
                onClick={() => openQuestionModal()}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
                data-testid="add-question-button"
              >
                <Plus className="w-4 h-4" />
                Novo Pitanje
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((question) => {
                const category = categories.find(c => c.id === question.category_id);
                return (
                  <div key={question.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                          >
                            {category?.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#8AB4F8]/20 text-[#8AB4F8]">
                            {question.question_type === 'multiple_choice' ? 'Višestruki' : 
                             question.question_type === 'true_false' ? 'Točno/Netočno' : 'Jedan odgovor'}
                          </span>
                          <span className="text-xs text-[#636E72]">{question.points} bod.</span>
                        </div>
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((opt) => (
                            <span 
                              key={opt.id}
                              className={`text-xs px-2 py-1 rounded-lg ${
                                opt.is_correct ? 'bg-[#00b894]/20 text-[#00b894]' : 'bg-white/50 text-[#636E72]'
                              }`}
                            >
                              {opt.text}
                              {opt.is_correct && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openQuestionModal(question)}
                          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                          data-testid={`edit-question-${question.id}`}
                        >
                          <Edit2 className="w-4 h-4 text-[#636E72]" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('question', question)}
                          className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors"
                          data-testid={`delete-question-${question.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-[#d63031]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Category Modal */}
        <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">
                {editingCategory ? 'Uredi Kategoriju' : 'Nova Kategorija'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Naziv</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input"
                  placeholder="npr. Matematika"
                  data-testid="category-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opis</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="glass-input min-h-[80px]"
                  placeholder="Kratki opis kategorije..."
                  data-testid="category-description-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Boja</label>
                <div className="flex gap-2">
                  {['#8AB4F8', '#55EFC4', '#FDCB6E', '#FF9FF3'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-xl transition-transform ${
                        categoryForm.color === color ? 'ring-2 ring-offset-2 ring-[#8AB4F8] scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <button 
                onClick={() => setCategoryModalOpen(false)} 
                className="btn-secondary"
              >
                Odustani
              </button>
              <button 
                onClick={saveCategory} 
                disabled={saving || !categoryForm.name.trim()}
                className="btn-primary flex items-center gap-2"
                data-testid="save-category-button"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Spremi
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Modal */}
        <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
          <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">
                {editingQuestion ? 'Uredi Pitanje' : 'Novo Pitanje'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategorija</label>
                  <Select 
                    value={questionForm.category_id} 
                    onValueChange={(v) => setQuestionForm(prev => ({ ...prev, category_id: v }))}
                  >
                    <SelectTrigger className="glass-input" data-testid="question-category-select">
                      <SelectValue placeholder="Odaberi kategoriju" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tip pitanja</label>
                  <Select 
                    value={questionForm.question_type} 
                    onValueChange={(v) => setQuestionForm(prev => ({ ...prev, question_type: v }))}
                  >
                    <SelectTrigger className="glass-input" data-testid="question-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_choice">Jedan odgovor</SelectItem>
                      <SelectItem value="multiple_choice">Višestruki izbor</SelectItem>
                      <SelectItem value="true_false">Točno / Netočno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tekst pitanja</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  className="glass-input min-h-[80px]"
                  placeholder="Unesite pitanje..."
                  data-testid="question-text-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bodovi</label>
                  <input
                    type="number"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                    className="glass-input"
                    min="1"
                    max="100"
                    data-testid="question-points-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Vrijeme (sekunde)</label>
                  <input
                    type="number"
                    value={questionForm.time_limit}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 30 }))}
                    className="glass-input"
                    min="10"
                    max="120"
                    data-testid="question-time-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Opcije odgovora</label>
                  <button
                    onClick={addOption}
                    className="text-sm text-[#8AB4F8] hover:underline flex items-center gap-1"
                    data-testid="add-option-button"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj opciju
                  </button>
                </div>
                <div className="space-y-2">
                  {questionForm.options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCorrect(option.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          option.is_correct 
                            ? 'bg-[#00b894] text-white' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        data-testid={`toggle-correct-${index}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                        className="glass-input flex-1"
                        placeholder={`Opcija ${index + 1}`}
                        data-testid={`option-input-${index}`}
                      />
                      {questionForm.options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors"
                        >
                          <X className="w-4 h-4 text-[#d63031]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#636E72] mt-2">
                  Kliknite ✓ za označavanje točnog odgovora
                </p>
              </div>
            </div>
            <DialogFooter>
              <button 
                onClick={() => setQuestionModalOpen(false)} 
                className="btn-secondary"
              >
                Odustani
              </button>
              <button 
                onClick={saveQuestion} 
                disabled={saving}
                className="btn-primary flex items-center gap-2"
                data-testid="save-question-button"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Spremi
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito'] text-[#d63031]">
                Potvrda brisanja
              </DialogTitle>
              <DialogDescription>
                {deleteTarget?.type === 'category' 
                  ? `Jeste li sigurni da želite obrisati kategoriju "${deleteTarget?.item?.name}"? Sva pitanja u ovoj kategoriji će također biti obrisana.`
                  : `Jeste li sigurni da želite obrisati ovo pitanje?`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                className="btn-secondary"
              >
                Odustani
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={saving}
                className="bg-[#d63031] text-white font-semibold py-2 px-4 rounded-full hover:bg-[#d63031]/90 transition-colors flex items-center gap-2"
                data-testid="confirm-delete-button"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Obriši
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPage;
