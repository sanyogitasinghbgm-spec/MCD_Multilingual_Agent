import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, ArrowRight, AlertCircle, MapPin, Languages, Sun, Moon, Sparkles, MessageSquare, CheckCircle, Mic, TrendingUp } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, setLanguage, language } = useI18n();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans selection:bg-emerald-200 transition-colors duration-500 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 dark:bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/50 dark:bg-orange-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[60] px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-4 rounded-[2rem]">
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              AI Powered Civic Resolution
            </div>
            
            <h1 className="text-7xl md:text-8xl font-extrabold text-stone-900 dark:text-stone-50 leading-[0.85] tracking-tighter mb-10 text-gradient">
              Your Voice <br />
              <span className="text-emerald-600 dark:text-emerald-500">Your Power</span> <br />
              Our Action
            </h1>
            
            <p className="text-2xl text-stone-500 dark:text-stone-400 mb-12 max-w-xl leading-relaxed font-light">
              The next generation of Delhi's civic management. Register complaints call, track in real-time, and see the change.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={() => navigate('/user')}
                className="neo-button group px-10 py-5 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-[2rem] font-bold flex items-center justify-center gap-4 text-lg shadow-2xl shadow-stone-900/20 dark:shadow-none"
              >
                <User className="w-6 h-6" />
                Citizen Portal
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="neo-button px-10 py-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-stone-800 rounded-[2rem] font-bold flex items-center justify-center gap-4 text-lg hover:bg-stone-50 dark:hover:bg-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-none"
              >
                <Shield className="w-6 h-6" />
                Admin Access
              </button>
            </div>

            <div className="mt-16 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-stone-50 dark:border-stone-950 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-stone-900 dark:text-stone-50">10,000+ Citizens</p>
                <p className="text-stone-500 dark:text-stone-400">Trusting Delhi AI for resolution</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 aspect-[4/5] bg-stone-200 dark:bg-stone-800 rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-none border-4 border-white dark:border-stone-800">
              <img 
                src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=1200&h=1500" 
                className="w-full h-full object-cover opacity-95 dark:opacity-80 hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
                alt="Delhi Landmark"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-stone-200 dark:border-stone-900">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">How it works</h2>
          <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-lg">Our AI-driven pipeline ensures every complaint is categorized, prioritized, and assigned to the right department instantly.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Mic className="w-8 h-8" />, title: 'Voice Registration', desc: 'Speak in Hindi or English. Our AI understands local dialects and context.' },
            { icon: <Sparkles className="w-8 h-8" />, title: 'AI Categorization', desc: 'Automatic detection of department and urgency level for faster routing.' },
            { icon: <TrendingUp className="w-8 h-8" />, title: 'Real-time Tracking', desc: 'Get live updates as your complaint moves from registered to resolved.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-10 rounded-[3rem] text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-4">{feature.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="bg-stone-950 text-stone-400 py-20 border-t border-stone-900">
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
                <li><button onClick={() => navigate('/user')} className="hover:text-emerald-500 transition-colors">Citizen Portal</button></li>
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
