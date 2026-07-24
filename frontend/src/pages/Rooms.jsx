import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import RoomCard from '../components/RoomCard.jsx';

export default function Rooms() {
  const { t, lang } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rooms?lang=${lang}`)
      .then(r => r.json())
      .then(data => { setRooms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lang]);

  return (
    <div className="container section">
      <span className="eyebrow">AZBAKU</span>
      <h1>{t('rooms.title')}</h1>
      <p style={{ color: 'var(--color-slate-light)', marginBottom: 'var(--space-4)' }}>{t('rooms.subtitle')}</p>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="grid grid--3">
          {rooms.map(room => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </div>
  );
}
