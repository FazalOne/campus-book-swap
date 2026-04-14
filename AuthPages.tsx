
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { User, AuthResponse } from './types';
import { useLanguage } from './LanguageContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<AuthResponse>('/auth/login', { username, password });
      login(res.user, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or server error');
    }
  };

  const handleForgotPassword = () => {
    const msg = language === 'tr' 
      ? "Şifre sıfırlama özelliği şu an devre dışıdır. Lütfen sistem yöneticisi ile iletişime geçin." 
      : "Password reset feature is currently disabled. Please contact the system administrator.";
    alert(msg);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base_200 p-4">
      <div className="max-w-md w-full bg-base_100 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">{t('app.title')}</h2>
        <h3 className="text-xl font-semibold text-center text-gray-700 mb-6">{t('nav.login')}</h3>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('admin.label.username')}</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:underline focus:outline-none"
              >
                {t('login.forgot_password')}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-600 transition font-bold">
            {t('nav.login')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-secondary font-bold hover:underline">{t('nav.register')}</Link>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<AuthResponse>('/auth/register', { 
          username, 
          password, 
          firstName, 
          lastName, 
          email, 
          phone 
      });
      login(res.user, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base_200 p-4">
      <div className="max-w-md w-full bg-base_100 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-secondary mb-6">{t('nav.register')}</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('reg.firstName')}</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('reg.lastName')}</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('admin.label.username')}</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('reg.email')}</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('reg.phone')}</label>
            <input 
              type="tel" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('reg.password')}</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-secondary text-white py-2 rounded-md hover:bg-emerald-600 transition font-bold">
            {t('nav.register')}
          </button>
        </form>
         <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  );
};
