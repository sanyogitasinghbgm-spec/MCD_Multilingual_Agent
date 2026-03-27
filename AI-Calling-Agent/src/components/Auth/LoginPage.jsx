import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Phone, User, ArrowRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';

// ✅ Delhi areas — UserRegister mein area field chahiye backend ko
const DELHI_AREAS = [
  'Connaught Place', 'Dwarka', 'Rohini', 'Saket',
  'Lajpat Nagar', 'Janakpuri', 'Karol Bagh'
];

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [phone, setPhone] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [area, setArea] = useState('');

  const navigate = useNavigate();

  // ✅ Login — backend POST /user/login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api.userLogin(phone);
    setLoading(false);

    if (!result) {
      setError('Login failed. Please try again.');
      return;
    }

    if (result.message === 'User not found') {
      setError('Phone number not registered. Please sign up first.');
      return;
    }

    // ✅ User data localStorage mein save karo
    localStorage.setItem('delhi_user', JSON.stringify({ phone }));
    navigate('/user');
  };

  // ✅ Register — backend POST /user/register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api.userRegister(name, regPhone, area);
    setLoading(false);

    if (!result) {
      setError('Registration failed. Please try again.');
      return;
    }

    if (result.message === 'User already exists') {
      setError('This phone number is already registered. Please login.');
      return;
    }

    // ✅ Auto login after register
    localStorage.setItem('delhi_user', JSON.stringify({ phone: regPhone, name, area }));
    navigate('/user');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-stone-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-xl border border-stone-200 dark:border-stone-800"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white dark:text-stone-900" />
          </div>
          <h1 className="text-3xl font-serif italic text-stone-900 dark:text-stone-100">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">
            {isRegistering ? 'Register as a Delhi citizen' : 'Sign in to continue your journey'}
          </p>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isRegistering ? (
            // ✅ LOGIN FORM — sirf phone chahiye
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9999999999"
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all outline-none text-stone-900 dark:text-stone-100"
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            // ✅ REGISTER FORM — name, phone, area chahiye backend ko
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all outline-none text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9999999999"
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all outline-none text-stone-900 dark:text-stone-100"
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 ml-1">
                  Your Area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all outline-none text-stone-900 dark:text-stone-100 appearance-none"
                    required
                  >
                    <option value="">Select your area</option>
                    {DELHI_AREAS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800 text-center">
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-stone-900 dark:text-stone-100 font-medium hover:underline"
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* ✅ Admin portal link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Admin Portal →
          </button>
        </div>
      </motion.div>
    </div>
  );
}