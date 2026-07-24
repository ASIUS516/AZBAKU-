import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function AdminLogin({ onLoggedIn }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      onLoggedIn?.();
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <h1>{t('admin.loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-3)' }}>
        <div className="field">
          <label htmlFor="admin-email">{t('admin.email')}</label>
          <input id="admin-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="admin-password">{t('admin.password')}</label>
          <input id="admin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={submitting} style={{ width: '100%' }}>
          {t('admin.login')}
        </button>
      </form>
    </div>
  );
}
