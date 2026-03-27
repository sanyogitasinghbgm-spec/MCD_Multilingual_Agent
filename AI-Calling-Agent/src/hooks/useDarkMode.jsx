import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DarkModeContext = createContext();

const http = axios.create({ baseURL: 'http://localhost:8000' });

export function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 🔁 Fallback: localStorage se initial value
    const saved = localStorage.getItem('delhi_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // ✅ App load hote hi MongoDB se latest preference fetch karo
  useEffect(() => {
    const phone = localStorage.getItem('delhi_user_phone');
    if (!phone) return; // login nahi hai toh skip

    http.get('/user/preferences', { params: { phone } })
      .then(({ data }) => {
        if (data.error) return;
        setIsDarkMode(data.dark_mode);
        // localStorage bhi sync karo
        localStorage.setItem('delhi_dark_mode', JSON.stringify(data.dark_mode));
      })
      .catch(() => {
        // MongoDB fail ho toh localStorage wali value use hoti rahegi
        console.warn('Preferences fetch failed, using localStorage fallback');
      });
  }, []);

  // ✅ Dark mode DOM pe apply karo
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);

    // localStorage update (backup)
    localStorage.setItem('delhi_dark_mode', JSON.stringify(newValue));

    // MongoDB update
    const phone = localStorage.getItem('delhi_user_phone');
    if (phone) {
      const language = localStorage.getItem('delhi_language') || 'hi';
      try {
        await http.put('/user/preferences', null, {
          params: { phone, dark_mode: newValue, language }
        });
      } catch {
        console.warn('Dark mode MongoDB save failed, localStorage updated');
      }
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}