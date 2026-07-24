import React from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="container section" style={{ maxWidth: 780 }}>
      <span className="eyebrow">AZBAKU</span>
      <h1>{t('about.title')}</h1>
      <p>{t('about.text1')}</p>
      <p>{t('about.text2')}</p>

      <div className="card" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <h3>{t('about.infoTitle')}</h3>
        <ul style={{ paddingLeft: '1.2rem' }}>
          <li>{t('about.checkInTime')}</li>
          <li>{t('about.checkOutTime')}</li>
          <li>{t('about.parking')}</li>
          <li>{t('about.breakfast')}</li>
        </ul>
      </div>
    </div>
  );
}
