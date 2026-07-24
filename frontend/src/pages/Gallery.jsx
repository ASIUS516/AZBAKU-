import React from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

// Placeholder photo paths - swap these for real photography when adapting for an actual hotel.
const PHOTOS = [
  '/images/gallery/lobby.jpg',
  '/images/gallery/lounge.jpg',
  '/images/gallery/room-1.jpg',
  '/images/gallery/restaurant.jpg',
  '/images/gallery/exterior.jpg',
  '/images/gallery/suite.jpg'
];

export default function Gallery() {
  const { t } = useLanguage();
  return (
    <div className="container section">
      <span className="eyebrow">AZBAKU</span>
      <h1>{t('gallery.title')}</h1>
      <div className="grid grid--3">
        {PHOTOS.map((src, i) => (
          <div
            key={i}
            style={{
              height: 220,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-accent-soft)',
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        ))}
      </div>
    </div>
  );
}
