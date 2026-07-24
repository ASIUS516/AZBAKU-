import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Reviews() {
  const { t, lang } = useLanguage();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`/api/reviews?lang=${lang}`).then(r => r.json()).then(setReviews).catch(() => {});
  }, [lang]);

  return (
    <div className="container section">
      <span className="eyebrow">AZBAKU</span>
      <h1>{t('reviews.title')}</h1>
      <div className="grid grid--2">
        {reviews.map(r => (
          <div key={r.id} className="card" style={{ padding: 'var(--space-3)' }}>
            <div style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </div>
            <p>{r.comment}</p>
            <strong>{r.guestName}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
