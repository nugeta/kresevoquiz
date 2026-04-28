import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import { 
  Plus, Edit2, Trash2, BookOpen, HelpCircle, Save, X, CheckCircle2,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Users, Trophy, BarChart3,
  Shield, ShieldOff, UserPlus, Crown, Link2, Copy, Download, ChevronLeft, ChevronRight, Key, RotateCcw, Megaphone, MessageSquare, AlertTriangle, Pencil
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const DIFF_COLORS = { easy: '#55EFC4', medium: '#FDCB6E', hard: '#FF7675' };
const DIFF_LABELS = { easy: 'Lako', medium: 'Srednje', hard: 'Teško' };

const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const validTabs = ['categories', 'questions', 'users', 'invites', 'announcements', 'groups'];
  const hashTab = location.hash.replace('#', '');
  const activeTab = validTabs.includes(hashTab) ? hashTab : 'categories';
  const { user, isAdmin, loading: authLoading } = useAuth();
  usePageTitle('Admin Panel');

  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPages, setQuestionPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'BookOpen', color: '#8AB4F8', parent_id: null });
  const [questionForm, setQuestionForm] = useState({
    category_id: '', question_text: '', question_type: 'single_choice',
    options: [{ id: crypto.randomUUID(), text: '', is_correct: false }, { id: crypto.randomUUID(), text: '', is_correct: false }],
    points: 10, time_limit: 30, difficulty: 'medium', image_url: null, correct_answer: ''
  });

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(10);
  const [aiDiff, setAiDiff] = useState('mix');
  const [assessResult, setAssessResult] = useState(null);
  const [assessing, setAssessing] = useState(false);
  const [assessPrompt, setAssessPrompt] = useState('');
  const [savedAssessPrompt, setSavedAssessPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('category');
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState('');
  const [invites, setInvites] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ max_uses: 1, note: '', group: '' });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteRequired, setInviteRequired] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ message: '', type: 'info' });
  const [annSaving, setAnnSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [groupSaving, setGroupSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [userActionModal, setUserActionModal] = useState(null); // {user, action: 'warn'|'message'|'rename'}
  const [userActionText, setUserActionText] = useState('');
  const [userActionSaving, setUserActionSaving] = useState(false);

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
        const [catRes, questRes, statsRes, usersRes, invitesRes, regRes, annRes, groupsRes, promptRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories`, { withCredentials: true }),
          axios.get(`${API_URL}/api/questions?page=1&limit=500`, { withCredentials: true }),
          axios.get(`${API_URL}/api/stats`, { withCredentials: true }),
          axios.get(`${API_URL}/api/users`, { withCredentials: true }),
          axios.get(`${API_URL}/api/invites`, { withCredentials: true }),
          axios.get(`${API_URL}/api/settings/registration`, { withCredentials: true }),
          axios.get(`${API_URL}/api/announcements`, { withCredentials: true }),
          axios.get(`${API_URL}/api/groups`, { withCredentials: true }),
          axios.get(`${API_URL}/api/settings/assessor-prompt`, { withCredentials: true }),
        ]);
        setCategories(catRes.data);
        setQuestions(questRes.data.questions);
        setQuestionTotal(questRes.data.total);
        setQuestionPages(questRes.data.pages);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setInvites(invitesRes.data);
        setInviteRequired(regRes.data.invite_required);
        setAnnouncements(annRes.data);
        setGroups(groupsRes.data);
        setSavedAssessPrompt(promptRes.data.prompt || '');
        setAssessPrompt(promptRes.data.prompt || '');
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
        color: category.color,
        parent_id: category.parent_id || null
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: 'BookOpen', color: '#8AB4F8', parent_id: null });
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
        options: question.options?.map(o => ({ ...o })) || [],
        points: question.points,
        time_limit: question.time_limit,
        difficulty: question.difficulty || 'medium',
        image_url: question.image_url || null,
        correct_answer: question.correct_answer || ''
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
        time_limit: 30,
        difficulty: 'medium',
        image_url: null,
        correct_answer: ''
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
    if (questionForm.question_type === 'upis') {
      if (!questionForm.correct_answer?.trim()) {
        alert('Unesite točan odgovor za Upis pitanje');
        return;
      }
    } else {
      if (questionForm.options.filter(o => o.text.trim()).length < 2) {
        alert('Dodajte barem 2 opcije');
        return;
      }
      if (!questionForm.options.some(o => o.is_correct)) {
        alert('Označite barem jedan točan odgovor');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...questionForm,
        options: questionForm.question_type === 'upis' ? [] : questionForm.options.filter(o => o.text.trim()),
        correct_answer: questionForm.question_type === 'upis' ? questionForm.correct_answer : undefined
      };

      if (editingQuestion) {
        await axios.put(`${API_URL}/api/questions/${editingQuestion.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/questions`, payload, { withCredentials: true });
      }
      // Refresh
      const [questRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/api/questions?page=${questionPage}&limit=50`, { withCredentials: true }),
        axios.get(`${API_URL}/api/categories`, { withCredentials: true })
      ]);
      setQuestions(questRes.data.questions || questRes.data);
      setQuestionTotal(questRes.data.total || questRes.data.length);
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

  const loadQuestionPage = async (page) => {
    try {
      const catParam = filterCategory !== 'all' ? `&category_id=${filterCategory}` : '';
      const diffParam = filterDifficulty !== 'all' ? `&difficulty=${filterDifficulty}` : '';
      const res = await axios.get(`${API_URL}/api/questions?page=${page}&limit=500${catParam}${diffParam}`, { withCredentials: true });
      setQuestions(res.data.questions);
      setQuestionTotal(res.data.total);
      setQuestionPages(res.data.pages);
      setQuestionPage(page);
    } catch (err) {}
  };

  // Re-fetch when category or difficulty filter changes
  useEffect(() => {
    if (!isAdmin) return;
    loadQuestionPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterDifficulty]);

  const exportQuestions = async () => {
    try {
      const catParam = filterCategory !== 'all' ? `?category_id=${filterCategory}` : '';
      const res = await axios.get(`${API_URL}/api/questions/export${catParam}`, { withCredentials: true });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'questions.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Greška pri izvozu'); }
  };

  const createInvite = async () => {
    setInviteSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/invites`, inviteForm, { withCredentials: true });
      const invRes = await axios.get(`${API_URL}/api/invites`, { withCredentials: true });
      setInvites(invRes.data);
      setInviteModalOpen(false);
      setInviteForm({ max_uses: 1, note: '', group: '' });
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
    finally { setInviteSaving(false); }
  };

  const deleteInvite = async (id) => {
    if (!window.confirm('Obrisati pozivni kod?')) return;
    await axios.delete(`${API_URL}/api/invites/${id}`, { withCredentials: true });
    setInvites(prev => prev.filter(i => i.id !== id));
  };

  const toggleInvite = async (id) => {
    await axios.put(`${API_URL}/api/invites/${id}/toggle`, {}, { withCredentials: true });
    setInvites(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  };

  const toggleInviteRequired = async () => {
    const newVal = !inviteRequired;
    await axios.put(`${API_URL}/api/settings/registration`, { invite_required: newVal }, { withCredentials: true });
    setInviteRequired(newVal);
  };

  const copyInviteLink = (code) => {
    const url = `${window.location.origin}/auth?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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

  const setUserGroup = async (u, group) => {
    try {
      await axios.put(`${API_URL}/api/users/${u.id}/group`, { group: group || null }, { withCredentials: true });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, group: group || null } : x));
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
  };

  const updateGroup = async (id, data) => {
    try {
      await axios.put(`${API_URL}/api/groups/${id}`, data, { withCredentials: true });
      setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
  };

  const resetUserScore = async (u) => {
    if (!window.confirm(`Resetirati rezultate za "${u.username}"?`)) return;
    try {
      await axios.put(`${API_URL}/api/users/${u.id}/reset-score`, {}, { withCredentials: true });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, total_score: 0, quizzes_taken: 0 } : x));
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    }
  };

  const submitUserAction = async () => {
    if (!userActionText.trim() || !userActionModal) return;
    setUserActionSaving(true);
    try {
      const { user: u, action } = userActionModal;
      if (action === 'rename') {
        await axios.put(`${API_URL}/api/users/${u.id}/rename`, { username: userActionText }, { withCredentials: true });
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, username: userActionText.toLowerCase() } : x));
      } else if (action === 'warn') {
        await axios.post(`${API_URL}/api/users/${u.id}/warn`, { message: userActionText }, { withCredentials: true });
      } else if (action === 'message') {
        await axios.post(`${API_URL}/api/users/${u.id}/message`, { message: userActionText }, { withCredentials: true });
      }
      setUserActionModal(null);
      setUserActionText('');
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
    finally { setUserActionSaving(false); }
  };

  const createGroup = async () => {
    if (!groupForm.name.trim()) return;
    setGroupSaving(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, { name: groupForm.name, description: groupForm.description });
        setGroupModalOpen(false);
        setEditingGroup(null);
        setGroupForm({ name: '', description: '' });
      } else {
        await axios.post(`${API_URL}/api/groups`, groupForm, { withCredentials: true });
        const res = await axios.get(`${API_URL}/api/groups`, { withCredentials: true });
        setGroups(res.data);
        setGroupModalOpen(false);
        setGroupForm({ name: '', description: '' });
      }
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
    finally { setGroupSaving(false); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Obrisati grupu?')) return;
    await axios.delete(`${API_URL}/api/groups/${id}`, { withCredentials: true });
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const createAnnouncement = async () => {
    if (!annForm.message.trim()) return;
    setAnnSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/announcements`, annForm, { withCredentials: true });
      const annRes = await axios.get(`${API_URL}/api/announcements`, { withCredentials: true });
      setAnnouncements(annRes.data);
      setAnnModalOpen(false);
      setAnnForm({ message: '', type: 'info' });
    } catch (err) { alert(err.response?.data?.detail || 'Greška'); }
    finally { setAnnSaving(false); }
  };

  const deleteAnnouncement = async (id) => {
    await axios.delete(`${API_URL}/api/announcements/${id}`, { withCredentials: true });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleBan = async (u) => {
    const action = u.is_banned ? 'unban' : 'ban';
    const msg = u.is_banned ? `Ukloniti ban za "${u.username}"?` : `Banirati "${u.username}"?`;
    if (!window.confirm(msg)) return;
    try {
      await axios.put(`${API_URL}/api/users/${u.id}/${action}`, {}, { withCredentials: true });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x));
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška');
    }
  };

  const saveAssessPrompt = async () => {
    setSavingPrompt(true);
    try {
      await axios.put(`${API_URL}/api/settings/assessor-prompt`, { prompt: assessPrompt }, { withCredentials: true });
      setSavedAssessPrompt(assessPrompt);
    } catch (err) { alert('Greška pri spremanju'); }
    finally { setSavingPrompt(false); }
  };

  const nukeQuestions = async () => {
    const targetCat = filterCategory !== 'all' ? categories.find(c => c.id === filterCategory) : null;
    const label = targetCat ? `kategoriju "${targetCat.name}"` : 'SVA pitanja';

    if (targetCat) {
      // Single category — two confirmations
      const c1 = window.confirm(`⚠️ Obrisati sva pitanja iz kategorije "${targetCat.name}"? Ova radnja je nepovratna.`);
      if (!c1) return;
      const typed = window.prompt(`Upiši naziv kategorije "${targetCat.name}" za potvrdu:`);
      if (typed !== targetCat.name) { alert('Pogrešan unos. Operacija otkazana.'); return; }
    } else {
      // All questions — three confirmations
      const c1 = window.confirm('⚠️ UPOZORENJE: Ovo će obrisati SVA pitanja iz baze. Jesi li siguran/na?');
      if (!c1) return;
      const c2 = window.confirm('⚠️ DRUGA POTVRDA: Ova radnja je NEPOVRATNA. Sva pitanja bit će trajno obrisana. Nastavi?');
      if (!c2) return;
      const typed = window.prompt('⚠️ TREĆA POTVRDA: Upiši "OBRIŠI SVE" za potvrdu:');
      if (typed !== 'OBRIŠI SVE') { alert('Pogrešan unos. Operacija otkazana.'); return; }
    }

    try {
      const url = targetCat
        ? `${API_URL}/api/questions?category_id=${targetCat.id}`
        : `${API_URL}/api/questions`;
      const res = await axios.delete(url, { withCredentials: true });
      alert(`💣 Obrisano ${res.data.deleted} pitanja iz ${label}.`);
      setQuestions(prev => targetCat ? prev.filter(q => q.category_id !== targetCat.id) : []);
      setQuestionTotal(prev => targetCat ? prev - res.data.deleted : 0);
      const catRes = await axios.get(`${API_URL}/api/categories`, { withCredentials: true });
      setCategories(catRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Greška pri brisanju');
    }
  };

  const assessQuestions = async (categoryId, autoFix = false) => {
    setAssessing(true); setAssessResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/questions/assess`,
        { category_id: categoryId || null, custom_prompt: assessPrompt, auto_fix: autoFix },
        { withCredentials: true });
      setAssessResult(res.data);
    } catch (err) { alert(err.response?.data?.detail || 'AI greška'); }
    finally { setAssessing(false); }
  };

  const aiGenerate = async (categoryId, difficulty) => {
    if (!aiTopic.trim()) { setBulkError('Unesite temu za generiranje'); return; }
    if (!categoryId) { setBulkError('Odaberi kategoriju prije generiranja'); return; }
    setAiGenerating(true); setBulkError(''); setBulkResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/questions/ai-generate`,
        { topic: aiTopic, category_id: categoryId, count: aiCount, difficulty: difficulty || 'medium' },
        { withCredentials: true }
      );
      setBulkJson(JSON.stringify(res.data.questions, null, 2));
      setBulkResult(`AI generirao ${res.data.count} pitanja — provjeri i klikni Uvezi`);
    } catch (err) {
      setBulkError(err.response?.data?.detail || 'AI greška');
    } finally { setAiGenerating(false); }
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
      setQuestions(questRes.data.questions || questRes.data);
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
        <Tabs value={activeTab} onValueChange={tab => navigate(`/admin#${tab}`, { replace: true })} className="animate-fade-in-up">
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
            <TabsTrigger value="invites" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <Key className="w-4 h-4 mr-2" />
              Pozivnice
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <Megaphone className="w-4 h-4 mr-2" />
              Objave
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-[var(--surface-solid)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />
              Grupe
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
              {categories.filter(c => !c.parent_id).map((category) => {
                const children = categories.filter(c => c.parent_id === category.id);
                const isExpanded = expandedCategory === category.id;
                const totalQuestions = children.length > 0
                  ? children.reduce((sum, c) => sum + c.question_count, 0)
                  : category.question_count;
                return (
                <div key={category.id} className="glass-card rounded-2xl overflow-hidden">
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span className="text-xl">{category.icon?.length <= 2 ? category.icon : '📚'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Nunito'] font-bold">{category.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {totalQuestions} pitanja
                        {children.length > 0 && ` · ${children.length} ${children.length === 1 ? 'tema' : children.length < 5 ? 'teme' : 'tema'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openCategoryModal({ ...category, parent_id: null }); }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Uredi kategoriju"
                        data-testid={`edit-category-${category.id}`}
                      >
                        <Edit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '', icon: category.icon, color: category.color, parent_id: category.id });
                          setCategoryModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Dodaj temu (podkategoriju)"
                      >
                        <Plus className="w-4 h-4" style={{ color: category.color }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal('category', category); }}
                        className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors"
                        data-testid={`delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#d63031]" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                      {/* Description */}
                      {category.description && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{category.description}</p>
                      )}

                      {/* Subcategories (themes) */}
                      {children.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>TEME</p>
                          <div className="space-y-1.5">
                            {children.map(child => (
                              <div key={child.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                                style={{ background: `${category.color}10`, border: `1px solid ${category.color}25` }}>
                                <span className="text-base shrink-0">{child.icon?.length <= 2 ? child.icon : '📖'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{child.name}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{child.question_count} pitanja</p>
                                </div>
                                <button onClick={() => openCategoryModal(child)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0" title="Uredi temu">
                                  <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                                </button>
                                <button onClick={() => openDeleteModal('category', child)}
                                  className="p-1.5 rounded-lg hover:bg-[#d63031]/10 transition-colors shrink-0">
                                  <Trash2 className="w-3.5 h-3.5 text-[#d63031]" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add subcategory button */}
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '', icon: category.icon, color: category.color, parent_id: category.id });
                          setCategoryModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all hover:opacity-80 w-full"
                        style={{ background: `${category.color}15`, color: category.color, border: `1px dashed ${category.color}40` }}>
                        <Plus className="w-4 h-4" /> Nova tema u "{category.name}"
                      </button>

                      {/* Sample questions (only if no children) */}
                      {children.length === 0 && (
                        <div className="space-y-1.5">
                          {questions.filter(q => q.category_id === category.id).slice(0, 5).map((q) => (
                            <div key={q.id} className="flex items-center gap-2 text-sm p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)' }}>
                              <HelpCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                              <span className="truncate flex-1">{q.question_text}</span>
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(138,180,248,0.15)', color: 'var(--primary)' }}>
                                {q.question_type === 'multiple_choice' ? 'Više' : q.question_type === 'true_false' ? 'T/N' : 'Jedan'}
                              </span>
                            </div>
                          ))}
                          {questions.filter(q => q.category_id === category.id).length > 5 && (
                            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                              ... i još {questions.filter(q => q.category_id === category.id).length - 5} pitanja
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}

              {/* Orphaned subcategories (children whose parent was deleted) */}
              {categories.filter(c => c.parent_id && !categories.find(p => p.id === c.parent_id)).length > 0 && (
                <div className="glass-card rounded-2xl p-4" style={{ border: '1px solid rgba(253,203,110,0.3)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: '#FDCB6E' }}>⚠️ Teme bez nadkategorije</p>
                  <div className="space-y-1.5">
                    {categories.filter(c => c.parent_id && !categories.find(p => p.id === c.parent_id)).map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="flex-1 text-sm">{c.name}</span>
                        <button onClick={() => openCategoryModal(c)} className="p-1.5 rounded-lg hover:bg-white/10">
                          <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button onClick={() => openDeleteModal('category', c)} className="p-1.5 rounded-lg hover:bg-[#d63031]/10">
                          <Trash2 className="w-3.5 h-3.5 text-[#d63031]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Pitanja ({questionTotal})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="glass-input !py-1.5 !px-3 text-sm w-auto">
                  <option value="all">Sve kategorije</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="glass-input !py-1.5 !px-3 text-sm w-auto">
                  <option value="all">Sve težine</option>
                  <option value="easy">Lako</option>
                  <option value="medium">Srednje</option>
                  <option value="hard">Teško</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="glass-input !py-1.5 !px-3 text-sm w-auto">
                  <option value="category">Sortiraj: Kategorija</option>
                  <option value="type">Sortiraj: Tip</option>
                  <option value="points">Sortiraj: Bodovi</option>
                  <option value="difficulty">Sortiraj: Težina</option>
                </select>
                <button onClick={exportQuestions} className="btn-secondary flex items-center gap-2 !py-2 !px-3">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={() => assessQuestions(filterCategory !== 'all' ? filterCategory : null, false)}
                  disabled={assessing} className="btn-secondary flex items-center gap-2 !py-2 !px-3 disabled:opacity-50"
                  title="AI analiza pitanja">
                  {assessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔍'} AI Analiza
                </button>
                <button onClick={() => { setBulkModalOpen(true); setBulkError(''); setBulkResult(null); }} className="btn-secondary flex items-center gap-2 !py-2 !px-4">
                  <Plus className="w-4 h-4" /> Bulk Uvoz
                </button>
                <button onClick={() => openQuestionModal()} className="btn-primary flex items-center gap-2 !py-2 !px-4" data-testid="add-question-button">
                  <Plus className="w-4 h-4" /> Novo Pitanje
                </button>
                <button onClick={nukeQuestions}
                  className="flex items-center gap-2 !py-2 !px-3 rounded-full font-semibold text-sm transition-all hover:opacity-80"
                  style={{ background: 'rgba(214,48,49,0.15)', color: '#d63031', border: '1px solid rgba(214,48,49,0.3)' }}
                  title={filterCategory !== 'all' ? `Obriši pitanja iz odabrane kategorije` : 'Obriši SVA pitanja'}>
                  💣 {filterCategory !== 'all' ? 'Nuke kategoriju' : 'Nuke sve'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {[...questions]
                .filter(q => filterDifficulty === 'all' || (q.difficulty || 'medium') === filterDifficulty)
                .sort((a, b) => {
                  if (sortBy === 'category') { const catA = categories.find(c => c.id === a.category_id)?.name || ''; const catB = categories.find(c => c.id === b.category_id)?.name || ''; return catA.localeCompare(catB); }
                  if (sortBy === 'type') return a.question_type.localeCompare(b.question_type);
                  if (sortBy === 'points') return b.points - a.points;
                  if (sortBy === 'difficulty') { const order = { easy: 0, medium: 1, hard: 2 }; return (order[a.difficulty || 'medium'] || 1) - (order[b.difficulty || 'medium'] || 1); }
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
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${DIFF_COLORS[question.difficulty || 'medium']}20`, color: DIFF_COLORS[question.difficulty || 'medium'] }}>
                            {DIFF_LABELS[question.difficulty || 'medium']}
                          </span>
                          <span className="text-xs text-[#636E72]">{question.points} bod.</span>
                        </div>
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((opt) => (
                            <span 
                              key={opt.id}
                              className="text-xs px-2 py-1 rounded-lg"
                              style={opt.is_correct
                                ? { background: 'rgba(0,184,148,0.15)', color: 'var(--success)' }
                                : { background: 'var(--glass-bg)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
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

            {/* Pagination */}
            {questionPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => loadQuestionPage(questionPage - 1)} disabled={questionPage === 1} className="p-2 rounded-lg glass disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">{questionPage} / {questionPages}</span>
                <button onClick={() => loadQuestionPage(questionPage + 1)} disabled={questionPage === questionPages} className="p-2 rounded-lg glass disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AI Assessor Prompt + Results */}
            <div className="mt-4 space-y-3">
              <div className="glass rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Baza prompta (sprema se trajno)</p>
                  <button onClick={saveAssessPrompt} disabled={savingPrompt || assessPrompt === savedAssessPrompt}
                    className="text-xs px-3 py-1 rounded-lg transition-all disabled:opacity-40"
                    style={{ background: 'var(--primary)', color: '#fff' }}>
                    {savingPrompt ? 'Sprema...' : assessPrompt === savedAssessPrompt ? '✓ Spremljeno' : 'Spremi'}
                  </button>
                </div>
                <textarea value={assessPrompt} onChange={e => setAssessPrompt(e.target.value)}
                  className="glass-input text-xs min-h-[80px] font-mono"
                  placeholder="Upiši upute za AI (npr. 'Miješaj poziciju točnog odgovora (1-4)', 'Osiguraj da su sva pitanja na hrvatskom', 'Ispravi barem 90% pitanja'...)" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => assessQuestions(filterCategory !== 'all' ? filterCategory : null, false)}
                  disabled={assessing} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm disabled:opacity-50">
                  {assessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔍'}
                  {assessing ? 'Analiziranje...' : `Analiziraj ${filterCategory !== 'all' ? 'kategoriju' : 'sve'}`}
                </button>
                <button onClick={() => assessQuestions(filterCategory !== 'all' ? filterCategory : null, true)}
                  disabled={assessing} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm disabled:opacity-50"
                  title="AI automatski ispravlja probleme i sprema u bazu">
                  {assessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔧'}
                  {assessing ? 'Ispravljanje...' : `Auto-ispravi ${filterCategory !== 'all' ? 'kategoriju' : 'sve'}`}
                </button>
              </div>

            {assessResult && (
              <div className="mt-6 glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  {assessResult.fixes ? (
                    <h3 className="font-bold">🔧 Auto-ispravak — {assessResult.fixed} ispravljeno, {assessResult.deleted} obrisano od {assessResult.total_analyzed} pitanja</h3>
                  ) : (
                    <h3 className="font-bold">🔍 AI Analiza — {assessResult.issues_found} problema od {assessResult.total_analyzed} pitanja</h3>
                  )}
                  <button onClick={() => setAssessResult(null)} className="text-xs hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>Zatvori</button>
                </div>
                {assessResult.fixes ? (
                  assessResult.fixes.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: '#55EFC4' }}>✅ Sva pitanja su već ispravna!</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {assessResult.fixes.map((fix, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: fix.fix_summary?.includes('DUPLICATE') ? 'rgba(214,48,49,0.1)' : 'rgba(85,239,196,0.08)', borderLeft: `3px solid ${fix.fix_summary?.includes('DUPLICATE') ? '#d63031' : '#55EFC4'}` }}>
                          <p className="font-medium text-sm mb-1 truncate">{fix.question}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>✏️ {fix.fix_summary}</p>
                        </div>
                      ))}
                    </div>
                  )
                ) : assessResult.issues?.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#55EFC4' }}>✅ Sva pitanja izgledaju dobro!</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {assessResult.issues?.map((issue, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: issue.severity === 'high' ? 'rgba(214,48,49,0.1)' : issue.severity === 'medium' ? 'rgba(253,203,110,0.1)' : 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${issue.severity === 'high' ? '#d63031' : issue.severity === 'medium' ? '#FDCB6E' : '#8AB4F8'}` }}>
                        <p className="font-medium text-sm mb-1">{issue.question_text}</p>
                        <ul className="space-y-0.5">
                          {issue.issues?.map((iss, j) => <li key={j} className="text-xs" style={{ color: 'var(--text-secondary)' }}>• {iss}</li>)}
                        </ul>
                        {issue.suggested_fix && (
                          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(138,180,248,0.1)', color: 'var(--primary)' }}>
                            💡 {issue.suggested_fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Korisnici ({users.length})</h2>
              <div className="flex items-center gap-2">
                <select id="user-group-filter" className="glass-input !py-1.5 !px-3 text-sm !w-auto"
                  onChange={e => {
                    const val = e.target.value;
                    document.querySelectorAll('[data-user-group]').forEach(el => {
                      el.style.display = (!val || el.dataset.userGroup === val) ? '' : 'none';
                    });
                  }}>
                  <option value="">Sve grupe</option>
                  <option value="__none__">Bez grupe</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
                <button
                  onClick={() => { setUserModalOpen(true); setUserError(''); setUserForm({ username: '', password: '', role: 'user' }); }}
                  className="btn-primary flex items-center gap-2 !py-2 !px-4"
                >
                  <UserPlus className="w-4 h-4" />
                  Novi Korisnik
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  data-user-group={u.group || '__none__'}>
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
                      {u.role === 'user' && !u.is_banned && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>Korisnik</span>
                      )}
                      {u.is_banned && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#d63031]/20 text-[#d63031] font-bold">🔨 Baniran</span>
                      )}
                      {u.group && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(85,239,196,0.2)', color: '#55EFC4' }}>
                          👥 {u.group}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {u.quizzes_taken} kvizova · {u.total_score} bodova · {new Date(u.created_at).toLocaleDateString('hr')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={u.group || ''}
                        onChange={e => {
                          const newGroup = e.target.value;
                          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, group: newGroup } : x));
                          setUserGroup({ ...u, group: newGroup }, newGroup);
                        }}
                        className="text-xs rounded-lg px-2 py-0.5 border-0 cursor-pointer"
                        style={{ background: u.group ? 'rgba(85,239,196,0.2)' : 'rgba(255,255,255,0.1)', color: u.group ? '#55EFC4' : 'var(--text-secondary)' }}>
                        <option value="">Bez grupe</option>
                        {u.group && !groups.find(g => g.name === u.group) && (
                          <option value={u.group}>{u.group}</option>
                        )}
                        {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>
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
                      <button
                        onClick={() => resetUserScore(u)}
                        className="p-2 rounded-lg hover:bg-[#FDCB6E]/10 transition-colors"
                        title="Resetiraj rezultate"
                      >
                        <RotateCcw className="w-4 h-4 text-[#FDCB6E]" />
                      </button>
                      <button onClick={() => { setUserActionModal({ user: u, action: 'rename' }); setUserActionText(u.username); }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Preimenuj">
                        <Pencil className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button onClick={() => { setUserActionModal({ user: u, action: 'warn' }); setUserActionText(''); }}
                        className="p-2 rounded-lg hover:bg-[#FDCB6E]/10 transition-colors" title="Upozori">
                        <AlertTriangle className="w-4 h-4 text-[#FDCB6E]" />
                      </button>
                      <button onClick={() => { setUserActionModal({ user: u, action: 'message' }); setUserActionText(''); }}
                        className="p-2 rounded-lg hover:bg-[#8AB4F8]/10 transition-colors" title="Pošalji poruku">
                        <MessageSquare className="w-4 h-4 text-[#8AB4F8]" />
                      </button>
                      <button
                        onClick={() => toggleBan(u)}
                        className={`p-2 rounded-lg transition-colors ${u.is_banned ? 'hover:bg-[#55EFC4]/10' : 'hover:bg-[#d63031]/10'}`}
                        title={u.is_banned ? 'Ukloni ban' : 'Baniraj'}
                      >
                        <span className="text-sm">{u.is_banned ? '✅' : '🔨'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="font-['Nunito'] text-xl font-bold">Pozivnice ({invites.length})</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Registracija zahtijeva pozivnicu:</span>
                  <label className="switch">
                    <input type="checkbox" checked={inviteRequired} onChange={toggleInviteRequired} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <button onClick={() => setInviteModalOpen(true)} className="btn-primary flex items-center gap-2 !py-2 !px-4">
                <Plus className="w-4 h-4" /> Nova Pozivnica
              </button>
            </div>
            <div className="space-y-3">
              {invites.map(inv => (
                <div key={inv.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold tracking-widest text-lg" style={{ color: 'var(--primary)' }}>{inv.code}</span>
                      {!inv.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Neaktivan</span>}
                      {inv.note && <span className="text-xs px-2 py-0.5 rounded-full glass">{inv.note}</span>}
                      {inv.group && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(85,239,196,0.2)', color: '#55EFC4' }}>👥 {inv.group}</span>}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {inv.uses}/{inv.max_uses} iskorišteno
                      {inv.used_by?.length > 0 && ` · ${inv.used_by.join(', ')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => copyInviteLink(inv.code)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Kopiraj link">
                      {copiedCode === inv.code ? <CheckCircle2 className="w-4 h-4 text-[#55EFC4]" /> : <Copy className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
                    </button>
                    <button onClick={() => toggleInvite(inv.id)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title={inv.active ? 'Deaktiviraj' : 'Aktiviraj'}>
                      <Link2 className="w-4 h-4" style={{ color: inv.active ? 'var(--primary)' : 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={() => deleteInvite(inv.id)} className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-[#d63031]" />
                    </button>
                  </div>
                </div>
              ))}
              {invites.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Nema pozivnica. Kreiraj prvu!</p>}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Objave ({announcements.length})</h2>
              <button onClick={() => setAnnModalOpen(true)} className="btn-primary flex items-center gap-2 !py-2 !px-4">
                <Megaphone className="w-4 h-4" /> Nova objava
              </button>
            </div>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="glass-card rounded-2xl p-4 flex items-start gap-3"
                  style={{ borderLeft: `4px solid ${a.type === 'warning' ? '#FDCB6E' : a.type === 'update' ? '#55EFC4' : '#8AB4F8'}` }}>
                  <span className="text-xl shrink-0">{a.type === 'warning' ? '⚠️' : a.type === 'update' ? '🆕' : 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{a.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{new Date(a.created_at).toLocaleDateString('hr')}</p>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-1 rounded-lg hover:bg-[#d63031]/10 shrink-0">
                    <Trash2 className="w-4 h-4 text-[#d63031]" />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Nema aktivnih objava.</p>}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Nunito'] text-xl font-bold">Grupe ({groups.length})</h2>
              <button onClick={() => { setEditingGroup(null); setGroupForm({ name: '', description: '' }); setGroupModalOpen(true); }} className="btn-primary flex items-center gap-2 !py-2 !px-4">
                <Plus className="w-4 h-4" /> Nova grupa
              </button>
            </div>
            <div className="space-y-3">
              {groups.map(g => {
                const members = users.filter(u => u.group === g.name);
                const isOpen = expandedCategory === g.id;
                return (
                  <div key={g.id} className="glass-card rounded-2xl overflow-hidden">
                    <button className="w-full flex items-center gap-4 p-4 text-left hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedCategory(isOpen ? null : g.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">👥 {g.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {members.length} članova{g.description ? ` · ${g.description}` : ''}
                        </p>
                      </div>
                      <span className="text-sm">{isOpen ? '▲' : '▼'}</span>
                      <button onClick={e => { e.stopPropagation(); setEditingGroup(g); setGroupForm({ name: g.name, description: g.description || '' }); setGroupModalOpen(true); }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Uredi grupu">
                        <Edit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteGroup(g.id); }}
                        className="p-2 rounded-lg hover:bg-[#d63031]/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-[#d63031]" />
                      </button>
                    </button>
                    {isOpen && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'var(--glass-border)' }}>
                        {members.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nema članova u ovoj grupi.</p>
                        ) : members.map(m => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-sm">{m.role === 'admin' ? '🛡️' : '👤'}</span>
                            <span className="flex-1 font-medium text-sm">{m.username}</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.total_score} bod · {m.quizzes_taken} kvizova</span>
                            <button
                              onClick={() => setUserGroup(m, '')}
                              className="text-xs px-2 py-0.5 rounded-lg hover:opacity-80 transition-opacity"
                              style={{ background: 'rgba(214,48,49,0.15)', color: '#d63031' }}
                              title="Ukloni iz grupe">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Nema grupa. Kreiraj prvu i dodaj je pozivnicama.</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Announcements Tab Content — added before Tabs closes */}

        {/* User Action Modal */}
        <Dialog open={!!userActionModal} onOpenChange={() => { setUserActionModal(null); setUserActionText(''); }}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">
                {userActionModal?.action === 'rename' ? `Preimenuj "${userActionModal?.user?.username}"` :
                 userActionModal?.action === 'warn' ? `Upozori "${userActionModal?.user?.username}"` :
                 `Poruka za "${userActionModal?.user?.username}"`}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {userActionModal?.action === 'rename' ? (
                <input type="text" value={userActionText} onChange={e => setUserActionText(e.target.value)}
                  className="glass-input" placeholder="Novo korisničko ime" />
              ) : (
                <textarea value={userActionText} onChange={e => setUserActionText(e.target.value)}
                  className="glass-input min-h-[100px]"
                  placeholder={userActionModal?.action === 'warn' ? 'Razlog upozorenja...' : 'Poruka korisniku...'} />
              )}
            </div>
            <DialogFooter>
              <button onClick={() => setUserActionModal(null)} className="btn-secondary">Odustani</button>
              <button onClick={submitUserAction} disabled={userActionSaving || !userActionText.trim()} className="btn-primary flex items-center gap-2">
                {userActionSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {userActionModal?.action === 'rename' ? 'Preimenuj' : userActionModal?.action === 'warn' ? 'Pošalji upozorenje' : 'Pošalji poruku'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Invite Modal */}
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">Nova Pozivnica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Maks. broj korištenja</label>
                <input type="number" min="1" max="100" value={inviteForm.max_uses} onChange={e => setInviteForm(p => ({ ...p, max_uses: parseInt(e.target.value) }))} className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Školska grupa (opcionalno)</label>
                <input type="text" value={inviteForm.group} onChange={e => setInviteForm(p => ({ ...p, group: e.target.value }))} className="glass-input" placeholder="npr. 3B, Maturanti 2026" />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Korisnici koji se registriraju ovim kodom bit će dodani u ovu grupu.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Napomena (opcionalno)</label>
                <input type="text" value={inviteForm.note} onChange={e => setInviteForm(p => ({ ...p, note: e.target.value }))} className="glass-input" placeholder="npr. Razred 3B" />
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setInviteModalOpen(false)} className="btn-secondary">Odustani</button>
              <button onClick={createInvite} disabled={inviteSaving} className="btn-primary flex items-center gap-2">
                {inviteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Kreiraj
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Group Modal */}
        <Dialog open={groupModalOpen} onOpenChange={open => { setGroupModalOpen(open); if (!open) { setEditingGroup(null); setGroupForm({ name: '', description: '' }); } }}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">{editingGroup ? 'Uredi grupu' : 'Nova grupa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Naziv grupe</label>
                <input type="text" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))}
                  className="glass-input" placeholder="npr. 3B, Maturanti 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opis (opcionalno)</label>
                <input type="text" value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))}
                  className="glass-input" placeholder="Kratki opis grupe" />
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => { setGroupModalOpen(false); setEditingGroup(null); setGroupForm({ name: '', description: '' }); }} className="btn-secondary">Odustani</button>
              <button onClick={createGroup} disabled={groupSaving || !groupForm.name.trim()} className="btn-primary flex items-center gap-2">
                {groupSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingGroup ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingGroup ? 'Spremi' : 'Kreiraj'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Announcement Modal */}
        <Dialog open={annModalOpen} onOpenChange={setAnnModalOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle className="font-['Nunito']">Nova objava</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tip</label>
                <select value={annForm.type} onChange={e => setAnnForm(p => ({ ...p, type: e.target.value }))} className="glass-input">
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Upozorenje</option>
                  <option value="update">🆕 Ažuriranje</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Poruka</label>
                <textarea value={annForm.message} onChange={e => setAnnForm(p => ({ ...p, message: e.target.value }))}
                  className="glass-input min-h-[100px]" placeholder="Poruka za sve korisnike..." />
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setAnnModalOpen(false)} className="btn-secondary">Odustani</button>
              <button onClick={createAnnouncement} disabled={annSaving || !annForm.message.trim()} className="btn-primary flex items-center gap-2">
                {annSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                Objavi
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              {/* Live Preview */}
              <div className="rounded-2xl p-4 flex items-center gap-4 transition-all" style={{ background: `${categoryForm.color}18`, border: `1px solid ${categoryForm.color}40` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${categoryForm.color}30` }}>
                  {categoryForm.icon}
                </div>
                <div>
                  <p className="font-bold">{categoryForm.name || 'Naziv kategorije'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{categoryForm.description || 'Opis kategorije'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Naziv</label>
                <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} className="glass-input" placeholder="npr. Matematika" data-testid="category-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nadkategorija (opcionalno)</label>
                <select value={categoryForm.parent_id || ''} onChange={e => setCategoryForm(prev => ({ ...prev, parent_id: e.target.value || null }))} className="glass-input">
                  <option value="">Nema (glavna kategorija)</option>
                  {categories.filter(c => !c.parent_id && c.id !== editingCategory?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Postavi ovo za teme unutar kategorije (npr. WW1 unutar Historije)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opis</label>
                <textarea value={categoryForm.description} onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))} className="glass-input min-h-[60px]" placeholder="Kratki opis kategorije..." data-testid="category-description-input" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emoji ikona</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['📚','🧮','🌍','💡','🔬','🎨','🏆','⚽','🎵','🖥️','🧬','📐','🗺️','🎭','🚀','🌿','🏛️','🔭','🎯','💬'].map(e => (
                    <button key={e} onClick={() => setCategoryForm(prev => ({ ...prev, icon: e }))}
                      className={`w-9 h-9 rounded-lg text-lg transition-all hover:scale-110 ${categoryForm.icon === e ? 'ring-2 scale-110' : ''}`}
                      style={{ background: categoryForm.icon === e ? `${categoryForm.color}30` : 'rgba(255,255,255,0.1)', ringColor: categoryForm.color }}>
                      {e}
                    </button>
                  ))}
                </div>
                <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))} className="glass-input !py-2 text-center text-xl" placeholder="ili upiši emoji" maxLength={2} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Boja</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['#8AB4F8','#55EFC4','#FDCB6E','#FF9FF3','#FF7675','#A29BFE','#00CEC9','#FD79A8','#E17055','#74B9FF','#6C5CE7','#00B894','#FDCB6E','#E84393','#2D3436'].map(color => (
                    <button key={color} onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${categoryForm.color === color ? 'ring-2 ring-offset-1 scale-110' : ''}`}
                      style={{ backgroundColor: color, ringColor: color }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={categoryForm.color} onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <input type="text" value={categoryForm.color} onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))} className="glass-input !py-2 font-mono text-sm" placeholder="#8AB4F8" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setCategoryModalOpen(false)} className="btn-secondary">Odustani</button>
              <button onClick={saveCategory} disabled={saving || !categoryForm.name.trim()} className="btn-primary flex items-center gap-2" data-testid="save-category-button">
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
                      <SelectItem value="upis">Upis (upiši odgovor)</SelectItem>
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

              <div>
                <label className="block text-sm font-medium mb-2">Slika (URL, opcionalno)</label>
                <input
                  type="url"
                  value={questionForm.image_url || ''}
                  onChange={e => setQuestionForm(prev => ({ ...prev, image_url: e.target.value || null }))}
                  className="glass-input"
                  placeholder="https://..."
                />
                {questionForm.image_url && (
                  <img src={questionForm.image_url} alt="preview" className="mt-2 rounded-xl max-h-32 object-cover" onError={e => e.target.style.display='none'} />
                )}
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
                <div>
                  <label className="block text-sm font-medium mb-2">Težina</label>
                  <select value={questionForm.difficulty} onChange={e => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value }))} className="glass-input">
                    <option value="easy">Lako</option>
                    <option value="medium">Srednje</option>
                    <option value="hard">Teško</option>
                  </select>
                </div>
              </div>

              {questionForm.question_type === 'upis' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Točan odgovor</label>
                  <input
                    type="text"
                    value={questionForm.correct_answer || ''}
                    onChange={e => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="glass-input"
                    placeholder="Upiši točan odgovor (npr. Pariz, Jupiter, 1918...)"
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Djelomični odgovori dobivaju djelomične bodove. Npr. ako je odgovor "Austro-Ugarska Monarhija", "Austro-Ugarska" će dobiti ~70% bodova.
                  </p>
                </div>
              ) : (
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
                            : ''
                        }`}
                        style={!option.is_correct ? { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' } : {}}
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
              )}
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
                Uvezi JSON datoteku ili zalijepi JSON array pitanja.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">

              {/* File upload — primary on mobile */}
              <div className="glass rounded-xl p-4">
                <label className="block text-sm font-semibold mb-3">📁 Uvezi JSON datoteku</label>
                <input
                  type="file"
                  accept=".json"
                  className="glass-input text-sm"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setBulkJson(ev.target.result);
                      setBulkError('');
                      setBulkResult(null);
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
                {bulkJson && !bulkError && (
                  <p className="text-xs mt-2" style={{ color: '#55EFC4' }}>
                    ✓ Datoteka učitana — klikni Uvezi
                  </p>
                )}
              </div>

              {/* AI Generator */}
              <div className="glass rounded-xl p-3 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">✨ AI Generiranje <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>(Gemini)</span></p>
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                    placeholder="Tema (npr. Drugi svjetski rat)" className="glass-input text-sm flex-1 !py-2" style={{ minWidth: '140px' }} />
                  <select id="ai-cat" className="glass-input text-sm !py-2 !w-auto">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={aiDiff} onChange={e => setAiDiff(e.target.value)} className="glass-input text-sm !py-2 !w-auto">
                    <option value="mix">Mix težina</option>
                    <option value="easy">Lako</option>
                    <option value="medium">Srednje</option>
                    <option value="hard">Teško</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>Broj pitanja:</label>
                    <input type="number" min={1} max={100} value={aiCount}
                      onChange={e => setAiCount(Number(e.target.value))}
                      className="glass-input text-sm !py-2 !w-20 text-center" />
                  </div>
                  <button onClick={() => aiGenerate(document.getElementById('ai-cat')?.value, aiDiff)}
                    disabled={aiGenerating || !aiTopic.trim()} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm disabled:opacity-50 shrink-0">
                    {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : '✨'}
                    {aiGenerating ? 'Generiranje...' : 'Generiraj'}
                  </button>
                </div>
              </div>

              {/* Paste JSON — hidden on mobile, shown on desktop */}
              <details className="hidden sm:block">
                <summary className="text-sm font-medium cursor-pointer select-none mb-2" style={{ color: 'var(--text-secondary)' }}>
                  📋 Zalijepi JSON ručno
                </summary>
                <textarea
                  value={bulkJson}
                  onChange={e => { setBulkJson(e.target.value); setBulkError(''); setBulkResult(null); }}
                  className="glass-input font-mono text-xs min-h-[150px] mt-2"
                  placeholder='[{"category_id": "...", ...}]'
                />
              </details>

              {/* Format reference — collapsed by default */}
              <details>
                <summary className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                  ℹ️ Format i ID-evi kategorija
                </summary>
                <div className="mt-2 space-y-2">
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
    "time_limit": 30,
    "difficulty": "easy"
  }
]`}</pre>
                  </div>
                  <div className="glass rounded-xl p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p className="font-semibold mb-2">ID-evi kategorija:</p>
                    {categories.filter(c => !c.parent_id).map(parent => {
                      const children = categories.filter(c => c.parent_id === parent.id);
                      return (
                        <div key={parent.id} className="mb-2">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            📁 {parent.name}
                          </p>
                          <p className="font-mono pl-2" style={{ color: 'var(--text-secondary)' }}>
                            {parent.id} — <span className="italic">({parent.name})</span>
                          </p>
                          {children.map(child => (
                            <p key={child.id} className="font-mono pl-4">
                              ↳ {child.id} — {child.name}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>

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
              <button onClick={() => { setBulkModalOpen(false); setBulkJson(''); }} className="btn-secondary">Zatvori</button>
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
