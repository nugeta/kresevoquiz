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
  BarChart3,
  Shield,
  ShieldOff,
  UserPlus,
  Crown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = import.meta.env.VITE_BACKEND_URL;

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
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('category');
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState('');

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
        const [catRes, questRes, statsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories`, { withCredentials: true }),
          axios.get(`${API_URL}/api/questions`, { withCredentials: true }),
          axios.get(`${API_URL}/api/stats`, { withCredentials: true }),
          axios.get(`${API_URL}/api/users`, { withCredentials: true }),
        ]);
        setCategories(catRes.data);
        setQuestions(questRes.data);
        setStats(statsRes.data);
        setUsers(usersRes.data);
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

  const createUser = async () => {
    setUserError('');
    if (!userForm.username.trim() || !userForm.password.trim()) {
      setUserError('Korisničko ime i lozinka su obavezni');
      return;
    }
    setUserSaving(true);
    try {
      await axios.post(`${API_URL}/api/users`, userForm, { withCredentials: true });
      const res = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
      setUsers(res.data);
      setUserModalOpen(false);
      setUserForm({ username: '', password: '', role: 'user' });
    } catch (err) {
      setUserError(err.response?.data?.detail || 'Greška');
    } finally {
      setUserSaving(false);
    }
  };

  const toggleUserRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await axios.put(`${API_URL}/api/users/${u.id}/role`, { role: newRole }, { withCredentials: true });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Obrisati korisnika "${u.username}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/users/${u.id}`, { withCredentials: true });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    }
  };

  const bulkImport = async () => {
    setBulkError('');
    setBulkResult(null);
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('JSON mora biti array ([...])');
    } catch (e) {
      setBulkError('Nevažeći JSON: ' + e.message);
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/questions/bulk`, parsed, { withCredentials: true });
      setBulkResult(res.data.message);
      setBulkJson('');
      // Refresh questions and categories
      const [questRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/api/questions`, { withCredentials: true }),
        axios.get(`${API_URL}/api/categories`, { withCredentials: true }),
      ]);
      setQuestions(questRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setBulkError(err.response?.data?.detail || 'Greška pri uvozu');
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
            <TabsTrigger value="categories" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Kategorije
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              Pitanja
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />
              Korisnici
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
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Pitanja ({questions.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                {/* Category filter */}
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="glass-input !py-1.5 !px-3 text-sm w-auto"
                >
                  <option value="all">Sve kategorije</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="glass-input !py-1.5 !px-3 text-sm w-auto"
                >
                  <option value="category">Sortiraj: Kategorija</option>
                  <option value="type">Sortiraj: Tip</option>
                  <option value="points">Sortiraj: Bodovi</option>
                </select>
                <button
                  onClick={() => { setBulkModalOpen(true); setBulkError(''); setBulkResult(null); }}
                  className="btn-secondary flex items-center gap-2 !py-2 !px-4"
                >
                  <Plus className="w-4 h-4" />
                  Bulk Uvoz
                </button>
                <button
                  onClick={() => openQuestionModal()}
                  className="btn-primary flex items-center gap-2 !py-2 !px-4"
                  data-testid="add-question-button"
                >
                  <Plus className="w-4 h-4" />
                  Novo Pitanje
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {[...questions]
                .filter(q => filterCategory === 'all' || q.category_id === filterCategory)
                .sort((a, b) => {
                  if (sortBy === 'category') {
                    const catA = categories.find(c => c.id === a.category_id)?.name || '';
                    const catB = categories.find(c => c.id === b.category_id)?.name || '';
                    return catA.localeCompare(catB);
                  }
                  if (sortBy === 'type') return a.question_type.localeCompare(b.question_type);
                  if (sortBy === 'points') return b.points - a.points;
                  return 0;
                })
                .map((question) => {
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

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Korisnici ({users.length})</h2>
              <button
                onClick={() => { setUserModalOpen(true); setUserError(''); setUserForm({ username: '', password: '', role: 'user' }); }}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
              >
                <UserPlus className="w-4 h-4" />
                Novi Korisnik
              </button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{u.username}</span>
                      {u.is_global_admin && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#FDCB6E]/20 text-[#FDCB6E]">
                          <Crown className="w-3 h-3" /> Global Admin
                        </span>
                      )}
                      {!u.is_global_admin && u.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED]">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {u.role === 'user' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/30 text-[#636E72]">Korisnik</span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {u.quizzes_taken} kvizova · {u.total_score} bodova · {new Date(u.created_at).toLocaleDateString('hr')}
                    </p>
                  </div>
                  {!u.is_global_admin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleUserRole(u)}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title={u.role === 'admin' ? 'Ukloni admin prava' : 'Dodaj admin prava'}
                      >
                        {u.role === 'admin'
                          ? <ShieldOff className="w-4 h-4 text-[#636E72]" />
                          : <Shield className="w-4 h-4 text-[#7C3AED]" />
                        }
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#d63031]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create User Modal */}
        <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">Novi Korisnik</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Korisničko ime</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))}
                  className="glass-input"
                  placeholder="korisnik123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lozinka</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                  className="glass-input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Uloga</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                  className="glass-input"
                >
                  <option value="user">Korisnik</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userError && (
                <div className="flex items-center gap-2 text-sm text-[#d63031]">
                  <AlertCircle className="w-4 h-4 shrink-0" />{userError}
                </div>
              )}
            </div>
            <DialogFooter>
              <button onClick={() => setUserModalOpen(false)} className="btn-secondary">Odustani</button>
              <button
                onClick={createUser}
                disabled={userSaving}
                className="btn-primary flex items-center gap-2"
              >
                {userSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Kreiraj
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

        {/* Bulk Import Modal */}
        <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
          <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">Bulk Uvoz Pitanja</DialogTitle>
              <DialogDescription>
                Zalijepi JSON array pitanja. Svako pitanje mora imati: category_id, question_text, question_type, options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="glass rounded-xl p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-semibold mb-1">Format primjer:</p>
                <pre className="overflow-x-auto whitespace-pre-wrap">{`[
  {
    "category_id": "ID_KATEGORIJE",
    "question_text": "Koliko je 2+2?",
    "question_type": "single_choice",
    "options": [
      { "text": "3", "is_correct": false },
      { "text": "4", "is_correct": true }
    ],
    "points": 10,
    "time_limit": 30
  }
]`}</pre>
              </div>
              <div className="glass rounded-xl p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-semibold mb-1">ID-evi kategorija:</p>
                {categories.map(c => (
                  <p key={c.id}><span className="font-mono">{c.id}</span> — {c.name}</p>
                ))}
              </div>
              <textarea
                value={bulkJson}
                onChange={e => { setBulkJson(e.target.value); setBulkError(''); setBulkResult(null); }}
                className="glass-input font-mono text-xs min-h-[200px]"
                placeholder='[{"category_id": "...", ...}]'
              />
              {bulkError && (
                <div className="flex items-center gap-2 text-sm text-[#d63031]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="flex items-center gap-2 text-sm text-[#00b894]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {bulkResult}
                </div>
              )}
            </div>
            <DialogFooter>
              <button onClick={() => setBulkModalOpen(false)} className="btn-secondary">Zatvori</button>
              <button
                onClick={bulkImport}
                disabled={saving || !bulkJson.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Uvezi
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPage;
