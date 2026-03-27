import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './hooks/useI18n';
import { DarkModeProvider } from './hooks/useDarkMode';
import LandingPage from './components/Landing/LandingPage';
import UserPage from './components/User/UserPage';
import AdminPage from './components/Admin/AdminPage';
import LoginPage from './components/Auth/LoginPage';

export default function App() {
  return (
    <DarkModeProvider>
      <I18nProvider>
        <Router>
          <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </Router>
      </I18nProvider>
    </DarkModeProvider>
  );
}
