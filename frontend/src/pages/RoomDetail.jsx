import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import BookingCalendar from '../components/BookingCalendar.jsx';
import './RoomDetail.css';

export default function RoomDetail() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [range, setRange] = useState({ checkIn: null, checkOut: null });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetch(`/api/rooms/${slug}?lang=${lang}`).then(r => r.json()).then(setRoom);
  }, [slug, lang]);

  const checkAvailability = useCallback(async (checkIn, checkOut) => {
    if (!checkIn || !checkOut) { setAvailability(null); return; }
    setCheckingAvailability(true);
    try {
      const res = await fetch(`/api/rooms/${slug}/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAvailability(false);
    }
  }, [slug]);

  function handleRangeChange({ checkIn, checkOut }) {
    setRange({ checkIn, checkOut });
    if (checkIn && checkOut) checkAvailability(checkIn, checkOut);
    else setAvailability(null);
  }

  function proceedToBooking() {
    const params = new URLSearchParams({ checkIn: range.checkIn, checkOut: range.checkOut });
    navigate(`/booking/${slug}?${params.toString()}`);
  }

  if (!room) return <div className="container section">{t('common.loading')}</div>;

  return (
    <div className="container section room-detail">
      <Link to="/rooms" className="room-detail__back">← {t('roomDetail.back')}</Link>

      <div className="room-detail__grid">
        <div>
          <div className="room-detail__gallery">
            {room.photos.map((photo, i) => (
              <div key={i} className="room-detail__photo" style={{ backgroundImage: `url(${photo})` }} />
            ))}
          </div>

          <h1>{room.name}</h1>
          <p className="room-detail__meta">
            {t('rooms.capacity', { count: room.capacity })} · {t('rooms.size', { size: room.sizeSqm })}
          </p>

          <h2 className="room-detail__section-title">{t('roomDetail.description')}</h2>
          <p>{room.description}</p>

          <h2 className="room-detail__section-title">{t('roomDetail.amenities')}</h2>
          <ul className="room-detail__amenities">
            {room.amenities.map(a => <li key={a}>{t(`amenities.${a}`)}</li>)}
          </ul>
        </div>

        <aside className="room-detail__booking-panel card">
          <div className="room-detail__price-line">
            <strong>{format(room.pricePerNight)}</strong> <span>{t('rooms.perNight')}</span>
          </div>

          <h3>{t('roomDetail.selectDates')}</h3>
          <BookingCalendar roomSlug={slug} onRangeChange={handleRangeChange} />

          {range.checkIn && range.checkOut && (
            <div className="room-detail__summary">
              {checkingAvailability && <p>{t('common.loading')}</p>}
              {!checkingAvailability && availability && (
                <>
                  <p>{t('roomDetail.nights', { count: availability.nights })}</p>
                  {availability.available ? (
                    <>
                      <p className="room-detail__units-left">
                        {t('roomDetail.unitsLeft', { count: availability.unitsLeft })}
                      </p>
                      <div className="room-detail__total">
                        {t('roomDetail.totalPrice')}: <strong>{format(availability.totalPrice)}</strong>
                      </div>
                      <button className="btn btn--primary room-detail__cta" onClick={proceedToBooking}>
                        {t('roomDetail.proceedToBook')}
                      </button>
                    </>
                  ) : (
                    <p className="room-detail__sold-out">{t('roomDetail.soldOut')}</p>
                  )}
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
