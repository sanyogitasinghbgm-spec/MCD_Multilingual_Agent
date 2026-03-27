import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, Bot, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../hooks/useI18n';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function VaaniVoiceAgent({ variant = 'floating' }) {
  const { t } = useI18n();
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Ready to call');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startCall = async () => {
    setIsConnecting(true);
    setStatus('Connecting...');

    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

    if (!publicKey || !assistantId) {
      setStatus('Config missing — check .env');
      setIsConnecting(false);
      return;
    }

    // ✅ Logged-in user ka phone lo
    const savedUser = localStorage.getItem('delhi_user');
    const userPhone = savedUser ? JSON.parse(savedUser).phone : null;
    const userName = savedUser ? JSON.parse(savedUser).name : 'Citizen';

    if (!userPhone) {
      setStatus('Please login first');
      setIsConnecting(false);
      return;
    }

    try {
      // ✅ assistantOverrides se userPhone inject karo Vapi mein
      // Vapi is phone number ko registerComplaint call mein use karega
      await api.vapi.startWithOverrides(assistantId, {
        variableValues: {
          userPhone: userPhone,
          userName: userName,
        },
        firstMessage: `Namaste ${userName} ji! Main Vaani hoon, Delhi Civic Assistant. Aap kaunsi samasya report karna chahte hain — Garbage, Water, ya Electricity?`,
      });
    } catch (error) {
      console.error("Vapi Start Error:", error);
      setStatus(error?.message || 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    api.vapi.stop();
  };

  useEffect(() => {
    const handleCallStart = () => { setIsConnecting(false); setIsCalling(true); setStatus('Connected'); };
    const handleCallEnd = () => { setIsCalling(false); setIsSpeaking(false); setStatus('Ready to call'); };
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);
    const handleError = (err) => {
      console.error("Vapi Error:", err);
      setStatus(err?.message || 'Call error');
      setIsConnecting(false);
      setIsCalling(false);
    };

    api.vapi.on('call-start', handleCallStart);
    api.vapi.on('call-end', handleCallEnd);
    api.vapi.on('speech-start', handleSpeechStart);
    api.vapi.on('speech-end', handleSpeechEnd);
    api.vapi.on('error', handleError);

    return () => {
      api.vapi.off('call-start', handleCallStart);
      api.vapi.off('call-end', handleCallEnd);
      api.vapi.off('speech-start', handleSpeechStart);
      api.vapi.off('speech-end', handleSpeechEnd);
      api.vapi.off('error', handleError);
    };
  }, []);

  const renderCallingUI = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={cn(
        "bg-stone-900/95 backdrop-blur-xl text-white p-8 rounded-[3.5rem] shadow-2xl border border-white/10 flex flex-col items-center",
        variant === 'floating' ? "w-80" : "w-full max-w-md mx-auto"
      )}
    >
      <div className="relative mb-8">
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [1, 1.2, 1] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-32 h-32 bg-emerald-400/20 rounded-full absolute -inset-6 z-0"
            />
          )}
        </AnimatePresence>
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-28 h-28 bg-gradient-to-br from-rose-400 to-emerald-400 rounded-full flex items-center justify-center relative z-10 shadow-inner"
        >
          <Bot className={`w-14 h-14 text-white drop-shadow-md transition-all ${isSpeaking ? 'scale-110' : ''}`} />
        </motion.div>
      </div>

      <h3 className="text-2xl font-bold mb-1 tracking-tight">Vaani AI</h3>
      <div className="h-6 mb-4">
        <motion.p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          {isSpeaking ? 'Speaking...' : 'Listening...'}
        </motion.p>
      </div>

      <div className="flex gap-4 w-full">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex-1 p-4 rounded-3xl transition-all flex items-center justify-center ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white hover:bg-white/10'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button
          onClick={endCall}
          className="flex-1 p-4 bg-rose-500 text-white rounded-3xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );

  if (variant === 'hero') {
    return (
      <div className="w-full">
        <AnimatePresence mode="wait">
          {isCalling ? (
            <div key="calling" className="flex justify-center">{renderCallingUI()}</div>
          ) : (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-[4rem] p-12 lg:p-20 text-center border-2 border-emerald-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-900/30 mb-8"
                >
                  <Sparkles className="w-4 h-4" />
                  Most Recommended
                </motion.div>

                <h2 className="text-5xl lg:text-7xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-none mb-6">
                  Talk to <span className="text-emerald-600">Vaani AI</span>
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-xl lg:text-2xl leading-relaxed font-medium max-w-2xl mx-auto mb-12">
                  The fastest way to report civic issues. Just speak naturally, and our AI will handle the registration for you.
                </p>

                <div className="flex flex-col items-center gap-6">
                  <button onClick={startCall} disabled={isConnecting} className="group relative">
                    <div className="absolute -inset-4 bg-emerald-500/20 rounded-[3rem] blur-xl group-hover:bg-emerald-500/30 transition-all animate-pulse" />
                    <div className="relative bg-emerald-600 text-white px-12 py-6 rounded-[2.5rem] font-bold text-2xl flex items-center gap-4 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/40">
                      {isConnecting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Phone className="w-8 h-8" />}
                      {isConnecting ? 'Connecting...' : 'Start AI Voice Call'}
                    </div>
                  </button>

                  {status !== 'Ready to call' && !isCalling && !isConnecting && (
                    <p className="text-red-500 text-sm font-bold">{status}</p>
                  )}
                  <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Available 24/7 • Multilingual</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-[3000] flex flex-col items-end gap-4">
      <AnimatePresence>{isCalling && renderCallingUI()}</AnimatePresence>
      <div className="flex flex-col items-end gap-2">
        {status !== 'Ready to call' && !isCalling && (
          <div className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-white/10">{status}</div>
        )}
        <button
          onClick={isCalling ? endCall : startCall}
          disabled={isConnecting}
          className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-white relative group ${isCalling ? 'bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {isConnecting ? <Loader2 className="w-8 h-8 text-white animate-spin" /> :
           isCalling ? <PhoneOff className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
        </button>
      </div>
    </div>
  );
}