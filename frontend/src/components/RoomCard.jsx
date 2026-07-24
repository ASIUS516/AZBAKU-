import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import './RoomCard.css';

export default function RoomCard({ room }) {
  const { t } = useLanguage();
  const { format } = useCurrency();

  return (
    <div className="room-card card">
      <div className="room-card__image" style={{ backgroundImage: `url(${room.photos[0]})` }} />
      <div className="room-card__body">
        <h3>{room.name}</h3>
        <p className="room-card__meta">
          {t('rooms.capacity', { count: room.capacity })} · {t('rooms.size', { size: room.sizeSqm })}
        </p>
        <p className="room-card__desc">{room.description}</p>
        <div className="room-card__footer">
          <div className="room-card__price">
            <strong>{format(room.pricePerNight)}</strong>
            <span>{t('rooms.perNight')}</span>
          </div>
          <Link to={`/rooms/${room.slug}`} className="btn btn--ghost">{t('rooms.viewDetails')}</Link>
        </div>
      </div>
    </div>
  );
}
