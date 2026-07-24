import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function BookingCancelled() {
  const { t } = useLanguage();
  return (
    <div className="container section" style={{ textAlign: 'center', maxWidth: 520 }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
      <h1>{t('booking.cancelledTitle')}</h1>
      <p>{t('booking.cancelledText')}</p>
      <Link to="/rooms" className="btn btn--primary" style={{ marginTop: 'var(--space-4)' }}>
        {t('nav.rooms')}
      </Link>
    </div>
  );
}
