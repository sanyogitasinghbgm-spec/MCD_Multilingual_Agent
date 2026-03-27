import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Trash2, Droplets, Zap, User, LogOut, X, Clock, Star, Sun, Moon, Sparkles, CheckCircle, AlertCircle, XCircle, MessageSquare, TrendingUp } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useDarkMode } from '../../hooks/useDarkMode';
import { api } from '../../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VaaniVoiceAgent from './VaaniVoiceAgent';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ✅ Backend status -> display label
const STATUS_DISPLAY = {
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

function FeedbackPrompt({ complaintId, onFeedbackSubmitted }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    // feedback backend mein nahi hai abhi, local only
    setSubmitted(true);
    setTimeout(() => {
      onFeedbackSubmitted();
    }, 2000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 text-center"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
          <CheckCircle className="w-6 h-6" />
        </div>
        <p className="text-emerald-700 dark:text-emerald-400 font-bold">{t('feedbackSuccess')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-6 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-none"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <p className="text-stone-900 dark:text-stone-50 font-bold text-lg">{t('feedbackPrompt')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2 justify-center py-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-all hover:scale-125"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-all duration-300",
                  (hover || rating) >= star
                    ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                    : "text-stone-300 dark:text-stone-700"
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('comment')}
          className="w-full px-5 py-4 text-sm rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none h-28 dark:text-stone-50"
        />

        <button
          type="submit"
          disabled={rating === 0}
          className="w-full py-4 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-2xl text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-900/20 dark:shadow-none"
        >
          {t('submitFeedback')}
        </button>
      </form>
    </motion.div>
  );
}

export default function UserPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // useEffect(() => {
  //   const savedUser = localStorage.getItem('delhi_user');
  //   if (savedUser) {
  //     const parsedUser = JSON.parse(savedUser);
  //     setUser(parsedUser);
  //     // ✅ User ki apni complaints fetch karo phone se
  //     fetchUserComplaints(parsedUser.phone);
  //     const interval = setInterval(() => fetchUserComplaints(parsedUser.phone), 5000);
  //     return () => clearInterval(interval);
  //   }
  // }, []);

  // ✅ Sirf yeh useEffect replace karo UserPage.jsx mein

  useEffect(() => {
    const savedUser = localStorage.getItem('delhi_user');
    if (!savedUser) return;

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchUserComplaints(parsedUser.phone);

    // ✅ phone ko variable mein store karo — stale closure avoid karo
    const phone = parsedUser.phone;
    const interval = setInterval(() => {
      fetchUserComplaints(phone);
    }, 5000);

    return () => clearInterval(interval);
  }, []); // ✅ [] — sirf mount par chalega, re-render par nahi

  // ✅ GET /user/my-complaints?phone=...
  const fetchUserComplaints = async (phone) => {
    const data = await api.getUserComplaints(phone);
    if (data) {
      const sorted = [...data].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setComplaints(sorted);
    }
  };

  // ✅ Login — backend POST /user/login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const phone = data.get('phone');

    const result = await api.userLogin(phone);
    setLoading(false);

    if (!result) {
      setError('Login failed. Please try again.');
      return;
    }
    if (result.message === 'User not found') {
      setError(t('userNotFound'));
      return;
    }

    const userData = { phone };
    setUser(userData);
    localStorage.setItem('delhi_user', JSON.stringify(userData));
    fetchUserComplaints(phone);
  };

  // ✅ Register — backend POST /user/register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const phone = data.get('phone');
    const name = data.get('name');
    // area optional — default Delhi
    const area = data.get('area') || 'Delhi';

    const result = await api.userRegister(name, phone, area);
    setLoading(false);

    if (!result) {
      setError('Registration failed. Please try again.');
      return;
    }
    if (result.message === 'User already exists') {
      setError(t('userAlreadyExists'));
      return;
    }

    const userData = { name, phone, area };
    setUser(userData);
    localStorage.setItem('delhi_user', JSON.stringify(userData));
    fetchUserComplaints(phone);
  };

  const handleFormSubmit = (e) => {
    if (isRegistering) {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('delhi_user');
    navigate('/');
  };

  // ✅ Cancel — backend PUT /user/cancel-complaint?ticket_id=...&phone=...
  const handleCancelComplaint = async (ticket_id) => {
    await api.cancelComplaint(ticket_id, user.phone);
    await fetchUserComplaints(user.phone);
    setCancellingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4 font-sans transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-stone-200 dark:border-stone-800 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />

          <div className="flex justify-center mb-8 relative z-10">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-5 rounded-[2rem] border-4 border-white dark:border-stone-800 shadow-xl">
              <User className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-center mb-2 text-stone-900 dark:text-stone-50 tracking-tight">{t('title')}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-center mb-10 font-medium uppercase tracking-widest text-[10px]">
            {isRegistering ? t('registerUser') : t('login')}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">{t('name')}</label>
                  <input
                    name="name"
                    required={isRegistering}
                    className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-stone-50"
                    placeholder="Enter your name"
                  />
                </motion.div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">{t('phone')}</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  maxLength={10}
                  className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-stone-50"
                  placeholder="9999999999"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isRegistering ? t('registerUser') : t('login')
              )}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs font-bold text-stone-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
            >
              {isRegistering ? t('alreadyHaveAccount') : t('dontHaveAccount')}
            </button>
          </div>

          <div className="mt-10 flex justify-center gap-2 relative z-10">
            {['hi', 'en'].map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  language === lang
                    ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-lg"
                    : "bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-stone-50"
                )}
              >
                {lang === 'hi' ? 'हिन्दी' : 'ENGLISH'}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans pb-20 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-4 rounded-[2rem]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-stone-900 dark:bg-stone-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-stone-900 dark:text-stone-50">Vaani<span className="text-emerald-600">AI</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {['hi', 'en'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    language === lang
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                  }`}
                >
                  {lang === 'hi' ? 'हिन्दी' : 'ENGLISH'}
                </button>
              ))}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 pl-2 pr-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all group"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-50 hidden sm:block">
                {user.name || user.phone}
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative z-10 border border-stone-200 dark:border-stone-800"
            >
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-8 right-8 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center mb-6 border-4 border-white dark:border-stone-800 shadow-xl">
                  <User className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
                  {user.name || user.phone}
                </h2>
                <div className="mt-2 px-4 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Verified Citizen
                </div>

                <div className="w-full mt-10 space-y-4">
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl text-left border border-stone-100 dark:border-stone-700">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{t('phone')}</p>
                    <p className="text-stone-900 dark:text-stone-50 font-bold">{user.phone}</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl text-left border border-stone-100 dark:border-stone-700">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{t('myComplaints')}</p>
                    <p className="text-stone-900 dark:text-stone-50 font-bold">{complaints.length}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-10 flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  {t('logout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-20">
          <VaaniVoiceAgent variant="hero" />
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-stone-900 dark:bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-white dark:text-stone-900 shadow-xl shadow-stone-900/20 dark:shadow-none">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">{t('myComplaints')}</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">Track your reported issues in real-time</p>
              </div>
            </div>
            <div className="px-5 py-2 bg-stone-100 dark:bg-stone-800 rounded-2xl text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] border border-stone-200 dark:border-stone-700">
              {complaints.length} Total
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {complaints.map((complaint) => (
                <motion.div
                  key={complaint.ticket_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group glass-card p-8 rounded-[3rem] border border-stone-100 dark:border-stone-800/50 hover:shadow-2xl transition-all relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-stone-500/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -ml-16 -mb-16 group-hover:bg-blue-500/10 transition-all duration-700" />

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    {/* ✅ Intent field */}
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 duration-500",
                      complaint.Intent === 'Garbage' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' :
                      complaint.Intent === 'Water' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500'
                    )}>
                      {complaint.Intent === 'Garbage' ? <Trash2 className="w-8 h-8" /> :
                       complaint.Intent === 'Water' ? <Droplets className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* ✅ lowercase status */}
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm",
                        complaint.status === 'pending' ? "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400" :
                        complaint.status === 'in_progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                        complaint.status === 'cancelled' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {STATUS_DISPLAY[complaint.status] || complaint.status}
                      </span>
                      {/* ✅ ticket_id */}
                      <span className="text-xs font-mono font-bold text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-lg">
                        #{(complaint.ticket_id || '').slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 relative z-10 flex-grow">
                    <div>
                      {/* ✅ Intent field for title */}
                      <h3 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight text-gradient">
                        {t(complaint.Intent?.toLowerCase())}
                      </h3>
                      {/* ✅ location string */}
                      <div className="flex items-start gap-2 text-stone-500 dark:text-stone-400 mt-3">
                        <MapPin className="w-5 h-5 mt-1 shrink-0 text-stone-300" />
                        <p className="text-base leading-relaxed">{complaint.location}</p>
                      </div>
                      {complaint.description && (
                        <p className="text-sm text-stone-400 mt-2 ml-7 leading-relaxed">
                          {complaint.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-6 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Reported</p>
                        <p className="text-base font-bold text-stone-900 dark:text-stone-50">
                          {new Date(complaint.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* ✅ Cancel — sirf pending complaints ke liye, ticket_id use */}
                      {complaint.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          {cancellingId === complaint.ticket_id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCancelComplaint(complaint.ticket_id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                              >
                                {t('confirm')}
                              </button>
                              <button
                                onClick={() => setCancellingId(null)}
                                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                              >
                                {t('cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancellingId(complaint.ticket_id)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs font-bold uppercase tracking-widest border border-red-100 dark:border-red-900/30"
                            >
                              <XCircle className="w-5 h-5" />
                              {t('cancel')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {complaint.status === 'completed' && !complaint.feedback && (
                    <div className="relative z-10">
                      <FeedbackPrompt
                        complaintId={complaint.ticket_id}
                        onFeedbackSubmitted={() => fetchUserComplaints(user.phone)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-24 bg-stone-50 dark:bg-stone-900/50 rounded-[4rem] border-2 border-dashed border-stone-200 dark:border-stone-800">
              <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-stone-200/50 dark:shadow-none">
                <AlertCircle className="w-10 h-10 text-stone-200" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">No complaints yet</h3>
              <p className="text-stone-500 dark:text-stone-400 max-w-xs mx-auto">Your history will appear here once you report your first civic issue.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-stone-950 text-stone-400 py-20 border-t border-stone-900 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xl font-extrabold tracking-tighter text-white">Vaani<span className="text-emerald-500">AI</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                AI-Powered Civic Resolution Portal. Speak naturally to report issues and track resolutions in real-time.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Navigation</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => navigate('/')} className="hover:text-emerald-500 transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/admin')} className="hover:text-emerald-500 transition-colors">Admin Access</button></li>
                <li><button className="hover:text-emerald-500 transition-colors">Support Center</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">Contact Support</h4>
              <ul className="space-y-6 text-sm">
                <li className="flex gap-3">
                  <MessageSquare className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>support@vaaniai.delhi.gov.in</span>
                </li>
                <li className="flex gap-3">
                  <TrendingUp className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>1800-11-5555 (Toll Free)</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-xs">© 2026 Vaani AI. All rights reserved.</p>
            <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Accessibility</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}