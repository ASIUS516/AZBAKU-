import React from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const GOOGLE_MAPS_EMBED_SRC = 'https://maps.google.com/maps?q=40.3777,49.8920&z=15&output=embed';
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=40.3777,49.8920';

export default function Contacts() {
  const { t } = useLanguage();
  return (
    <div className="container section">
      <span className="eyebrow">AZBAKU</span>
      <h1>{t('contacts.title')}</h1>

      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <p><strong>{t('contacts.address')}:</strong> Baku, Nizami Street 100</p>
          <p><strong>{t('contacts.phone')}:</strong> +994 12 000 00 00</p>
          <p><strong>{t('contacts.email')}:</strong> stay@azbakuhotel.com</p>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="btn btn--ghost">
            {t('contacts.mapLink')}
          </a>
        </div>

        <iframe
          title="AZBAKU location"
          src={GOOGLE_MAPS_EMBED_SRC}
          width="100%"
          height="320"
          style={{ border: 0, borderRadius: 'var(--radius-md)' }}
          loading="lazy"
        />
      </div>
    </div>
  );
}
