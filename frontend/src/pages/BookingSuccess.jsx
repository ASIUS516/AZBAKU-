import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const { t } = useLanguage();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`).then(r => r.json()).then(setBooking).catch(() => {});
  }, [bookingId]);

  return (
    <div className="container section" style={{ textAlign: 'center', maxWidth: 520 }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>✅</div>
      <h1>{t('booking.successTitle')}</h1>
      <p>{t('booking.successText', { name: booking?.guest_name || '' })}</p>
      {booking && (
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'left', marginTop: 'var(--space-3)' }}>
          <p><strong>{t('admin.dates')}:</strong> {booking.check_in} → {booking.check_out}</p>
          <p><strong>{t('admin.price')}:</strong> {booking.total_price} {booking.currency}</p>
        </div>
      )}
      <Link to="/" className="btn btn--primary" style={{ marginTop: 'var(--space-4)' }}>
        {t('nav.home')}
      </Link>
    </div>
  );
}
