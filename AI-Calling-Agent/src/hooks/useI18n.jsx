import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from '../i18n/translations';

const I18nContext = createContext(undefined);

const http = axios.create({ baseURL: 'http://localhost:8000' });

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // 🔁 Fallback: localStorage se initial value
    return localStorage.getItem('delhi_language') || 'hi';
  });

  // ✅ App load hote hi MongoDB se latest preference fetch karo
  useEffect(() => {
    const phone = localStorage.getItem('delhi_user_phone');
    if (!phone) return; // login nahi hai toh skip

    http.get('/user/preferences', { params: { phone } })
      .then(({ data }) => {
        if (data.error) return;
        setLanguageState(data.language);
        // localStorage bhi sync karo
        localStorage.setItem('delhi_language', data.language);
      })
      .catch(() => {
        console.warn('Language fetch failed, using localStorage fallback');
      });
  }, []);

  // ✅ Language change karo — MongoDB + localStorage dono update
  const setLanguage = async (lang) => {
    setLanguageState(lang);
    localStorage.setItem('delhi_language', lang);

    const phone = localStorage.getItem('delhi_user_phone');
    if (phone) {
      const dark_mode = JSON.parse(localStorage.getItem('delhi_dark_mode') || 'false');
      try {
        await http.put('/user/preferences', null, {
          params: { phone, dark_mode, language: lang }
        });
      } catch {
        console.warn('Language MongoDB save failed, localStorage updated');
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};