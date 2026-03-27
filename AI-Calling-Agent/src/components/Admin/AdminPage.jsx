import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Map as MapIcon, BarChart3, List, CheckCircle2, Clock, AlertCircle, Trash2, Droplets, Zap, User, LogOut, X, Globe, TrendingUp, ShieldAlert, Sun, Moon, Sparkles, Megaphone, Send, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../hooks/useI18n';
import { useDarkMode } from '../../hooks/useDarkMode';
import { AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DELHI_CENTER = [28.6139, 77.2090];

const AREA_COORDS = {
  'Connaught Place': [28.6304, 77.2177],
  'Dwarka': [28.5823, 77.0500],
  'Rohini': [28.7041, 77.1025],
  'Saket': [28.5245, 77.2100],
  'Lajpat Nagar': [28.5677, 77.2433],
  'Janakpuri': [28.6219, 77.0878],
  'Karol Bagh': [28.6550, 77.1888],
};

// ✅ Backend status -> Frontend display label
const STATUS_DISPLAY = {
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

// ✅ Frontend select value -> backend value
const STATUS_TO_BACKEND = {
  'Pending': 'pending',
  'In Progress': 'in_progress',
  'Completed': 'completed',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [admin, setAdmin] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [campaignForm, setCampaignForm] = useState({ name: '', area: 'All', message: '', type: 'Voice Call' });
  const [isCampaignStarting, setIsCampaignStarting] = useState(false);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('delhi_admin');
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));

    const fetchComplaints = async () => {
      const data = await api.getComplaints();
      if (data) setComplaints(data);
    };

    fetchComplaints();
    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Filter backend status values (lowercase)
  const filteredComplaints = complaints.filter(c => {
    const complaintDate = new Date(c.timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const displayStatus = STATUS_DISPLAY[c.status] || c.status;
    const matchesStatus = filter === 'All' || displayStatus === filter;
    const matchesType = typeFilter === 'All' || c.Intent === typeFilter;
    const matchesDate = (!start || complaintDate >= start) && (!end || complaintDate <= end);

    return matchesStatus && matchesType && matchesDate;
  });

  // ✅ Stats from backend lowercase status
  const stats = {
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
  };

  // ✅ Chart uses Intent field
  const chartData = [
    { name: 'Garbage', value: complaints.filter(c => c.Intent === 'Garbage').length },
    { name: 'Water', value: complaints.filter(c => c.Intent === 'Water').length },
    { name: 'Electricity', value: complaints.filter(c => c.Intent === 'Electricity').length },
  ];

  const COLORS = ['#f97316', '#3b82f6', '#eab308'];

  // ✅ Status update — ticket_id use karo, backend lowercase bhejo
  const handleStatusUpdate = async (ticket_id, frontendStatus) => {
    const backendStatus = STATUS_TO_BACKEND[frontendStatus] || frontendStatus;
    await api.updateStatus(ticket_id, backendStatus);
    const data = await api.getComplaints();
    if (data) setComplaints(data);
  };

  const handleForwardCall = async (ticket_id) => {
    const result = await api.forwardCall(ticket_id);
    if (result) {
      console.log(`Complaint ${ticket_id} forwarded.`);
    }
  };

  // ✅ Admin login/register — backend se
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const name = data.get('name');

    if (isRegistering) {
      const result = await api.adminRegister(name, email);
      if (!result) {
        setError('Registration failed. Please try again.');
        return;
      }
      if (result.message === 'Admin already exists') {
        setError(t('userAlreadyExists'));
        return;
      }
      const newAdmin = { name, email, role: 'Senior Administrator', department: 'Delhi Civic Services' };
      setAdmin(newAdmin);
      localStorage.setItem('delhi_admin', JSON.stringify(newAdmin));
    } else {
      const result = await api.adminLogin(email);
      if (!result) {
        setError('Login failed. Please try again.');
        return;
      }
      if (result.message === 'Admin not found') {
        setError(t('userNotFound'));
        return;
      }
      // ✅ Backend se naam nahi aata toh localStorage fallback
      const existingAdmin = JSON.parse(localStorage.getItem('delhi_admin_data_' + email) || 'null');
      const adminData = {
        name: existingAdmin?.name || email.split('@')[0],
        email,
        role: 'Senior Administrator',
        department: 'Delhi Civic Services'
      };
      setAdmin(adminData);
      localStorage.setItem('delhi_admin', JSON.stringify(adminData));
    }
  };

  const handleLogout = async () => {
    setAdmin(null);
    localStorage.removeItem('delhi_admin');
    navigate('/');
  };

  // ✅ Campaign — backend POST se, message field bhi bheja
  const handleStartCampaign = async (e) => {
    e.preventDefault();
    setIsCampaignStarting(true);
    const result = await api.startCampaign({
      name: campaignForm.name,
      area: campaignForm.area,
      message: campaignForm.message || `Campaign: ${campaignForm.name}`,
    });
    setIsCampaignStarting(false);
    if (result) {
      setCampaignForm({ name: '', area: 'All', message: '', type: 'Voice Call' });
      alert(t('campaignStarted') + ` (${result.total_calls || 0} calls triggered)`);
    } else {
      alert('Campaign failed. Please try again.');
    }
  };

  if (!admin) {
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
              <ShieldAlert className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-center mb-2 text-stone-900 dark:text-stone-50 tracking-tight">ADMIN<span className="text-emerald-600">PORTAL</span></h1>
          <p className="text-stone-500 dark:text-stone-400 text-center mb-10 font-medium uppercase tracking-widest text-[10px]">{isRegistering ? t('registerUser') : 'Secure Access Only'}</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-4">
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Admin Name</label>
                  <input
                    name="name"
                    required={isRegistering}
                    className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-stone-50"
                    placeholder="Enter admin name"
                  />
                </motion.div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                <input
                  name="email"
                  required
                  type="email"
                  className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-stone-50"
                  placeholder="admin@delhi.gov.in"
                />
              </div>
            </div>
            <button className="w-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 py-5 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xl shadow-stone-900/20 dark:shadow-none mt-4">
              {isRegistering ? t('registerUser') : t('login')}
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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-[1000] px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-4 rounded-[2rem]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-stone-900 dark:bg-stone-50 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-stone-900 dark:text-stone-50">ADMIN<span className="text-emerald-600">PORTAL</span></span>
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
                {admin.name.charAt(0)}
              </div>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-50 hidden sm:block">{admin.name}</span>
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
                <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">{admin.name}</h2>
                <div className="mt-2 px-4 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {admin.role}
                </div>

                <div className="w-full mt-10 space-y-4">
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl text-left border border-stone-100 dark:border-stone-700">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-stone-900 dark:text-stone-50 font-bold">{admin.email}</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl text-left border border-stone-100 dark:border-stone-700">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Department</p>
                    <p className="text-stone-900 dark:text-stone-50 font-bold">{admin.department}</p>
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

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            {[
              { label: t('pending'), value: stats.pending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-900/30', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.1)]' },
              { label: t('inProgress'), value: stats.inProgress, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]' },
              { label: t('completed'), value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "glass-card p-6 rounded-[2rem] border flex items-center justify-between group hover:scale-[1.02] transition-all duration-500",
                  stat.border,
                  stat.glow
                )}
              >
                <div>
                  <p className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-4xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight text-gradient">{stat.value}</p>
                </div>
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-8 h-8", stat.color)} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-2">
            <section className="glass-card rounded-[3rem] p-10 border border-stone-100 dark:border-stone-800/50 h-full flex flex-col justify-center">
              <div className="flex flex-col gap-10">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Megaphone className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">{t('outreachCampaign')}</h2>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Automated Citizen Outreach</p>
                    </div>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-xl">
                    Launch automated awareness campaigns via voice or SMS to targeted areas in Delhi. Reach thousands of citizens instantly with critical information.
                  </p>
                </div>

                {/* ✅ Campaign form — message field add kiya */}
                <form onSubmit={handleStartCampaign} className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t('campaignName')}</label>
                    <input
                      required
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 outline-none focus:border-emerald-500 transition-all text-sm dark:text-stone-50"
                      placeholder="e.g. Water Awareness 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t('selectArea')}</label>
                    <select
                      value={campaignForm.area}
                      onChange={(e) => setCampaignForm({ ...campaignForm, area: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 outline-none focus:border-emerald-500 transition-all text-sm dark:text-stone-50"
                    >
                      <option value="All">All Areas</option>
                      {Object.keys(AREA_COORDS).map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  {/* ✅ Message field — backend ko chahiye */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Campaign Message</label>
                    <input
                      required
                      value={campaignForm.message}
                      onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 outline-none focus:border-emerald-500 transition-all text-sm dark:text-stone-50"
                      placeholder="e.g. Water supply will be disrupted on 28th March"
                    />
                  </div>

                  <button
                    disabled={isCampaignStarting}
                    className="md:col-span-2 w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
                  >
                    {isCampaignStarting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('startCampaign')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="glass-card rounded-[3rem] p-8 border border-stone-100 dark:border-stone-800/50 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">{t('map')}</h2>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Geospatial Distribution</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">Live View</div>
            </div>
            <div className="h-[500px] rounded-[2.5rem] overflow-hidden border border-stone-100 dark:border-stone-800 shadow-inner">
              <MapContainer center={DELHI_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* ✅ location field use karo (backend string bhejta hai) */}
                {complaints.map((c, idx) => {
                  const coords = AREA_COORDS[c.location] || DELHI_CENTER;
                  return (
                    <CircleMarker
                      key={c.ticket_id || idx}
                      center={coords}
                      radius={10}
                      pathOptions={{
                        color: c.Intent === 'Garbage' ? '#f97316' : c.Intent === 'Water' ? '#3b82f6' : '#eab308',
                        fillOpacity: 0.6
                      }}
                    >
                      <Popup>
                        <div className="font-sans p-3 min-w-[180px]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded">
                              #{(c.ticket_id || '').slice(-6).toUpperCase()}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              c.status === 'pending' ? "bg-orange-50 text-orange-600" :
                              c.status === 'in_progress' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                              {STATUS_DISPLAY[c.status] || c.status}
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-stone-900 mb-1">{c.Intent}</p>
                          <p className="text-xs text-stone-600 leading-relaxed">{c.location}</p>
                          <p className="text-xs text-stone-400 mt-1">{c.userPhone}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </section>

          <section className="glass-card rounded-[3rem] p-8 border border-stone-100 dark:border-stone-800/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">{t('stats')}</h2>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category Analysis</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Analytics</div>
            </div>
            <div className="h-[500px] flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#292524" : "#f5f5f4"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '24px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#1c1917' : '#ffffff',
                        color: isDarkMode ? '#fafaf9' : '#1c1917'
                      }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        <section className="glass-card rounded-[3rem] border border-stone-100 dark:border-stone-800/50 overflow-hidden">
          <div className="p-10 border-b border-stone-50 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-stone-900 dark:bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-white dark:text-stone-900 shadow-xl shadow-stone-900/20 dark:shadow-none">
                <List className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight text-gradient">Complaints Registry</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">Manage and monitor all civic reports in real-time</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-2xl px-4 py-2">
                <Clock className="w-4 h-4 text-stone-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none dark:text-stone-50"
                />
              </div>
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-2xl px-4 py-2">
                <Clock className="w-4 h-4 text-stone-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none dark:text-stone-50"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 text-xs font-bold outline-none dark:text-stone-50"
              >
                <option value="All">All Types</option>
                <option value="Garbage">Garbage</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 text-xs font-bold outline-none dark:text-stone-50"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              {(startDate || endDate || filter !== 'All' || typeFilter !== 'All') && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setFilter('All'); setTypeFilter('All'); }}
                  className="p-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50">
                  <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Complaint</th>
                  <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Phone</th>
                  <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Location</th>
                  <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-xs font-bold text-stone-400 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {filteredComplaints.map((c, idx) => (
                  <tr key={c.ticket_id || idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group">
                    {/* ✅ Intent field use karo */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                          c.Intent === 'Garbage' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' :
                          c.Intent === 'Water' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500'
                        )}>
                          {c.Intent === 'Garbage' ? <Trash2 className="w-5 h-5" /> :
                           c.Intent === 'Water' ? <Droplets className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-stone-900 dark:text-stone-50">{c.Intent}</p>
                          {/* ✅ ticket_id use karo */}
                          <p className="text-[10px] font-mono font-bold text-stone-400">#{(c.ticket_id || '').slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    {/* ✅ userPhone field */}
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-50">{c.userPhone}</p>
                      <p className="text-xs text-stone-400">{c.source}</p>
                    </td>
                    {/* ✅ location string */}
                    <td className="px-8 py-6">
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{c.location}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{c.description?.slice(0, 40)}{c.description?.length > 40 ? '...' : ''}</p>
                    </td>
                    {/* ✅ lowercase status display */}
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        c.status === 'pending' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
                        c.status === 'in_progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                        c.status === 'completed' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                        "bg-stone-50 dark:bg-stone-800 text-stone-400"
                      )}>
                        {STATUS_DISPLAY[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {/* ✅ ticket_id bhejo status update mein */}
                      <select
                        value={STATUS_DISPLAY[c.status] || c.status}
                        onChange={(e) => handleStatusUpdate(c.ticket_id, e.target.value)}
                        className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 outline-none dark:text-stone-50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredComplaints.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-stone-200 dark:text-stone-700" />
                </div>
                <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No records found</p>
              </div>
            )}
          </div>
        </section>
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
                <li><button onClick={() => navigate('/user')} className="hover:text-emerald-500 transition-colors">Citizen Portal</button></li>
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