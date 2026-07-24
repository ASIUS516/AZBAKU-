import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

export default function Booking() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const { t, lang } = useLanguage();
  const { currency, format } = useCurrency();

  const [room, setRoom] = useState(null);
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/rooms/${slug}?lang=${lang}`).then(r => r.json()).then(setRoom);
  }, [slug, lang]);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch('/api/bookings/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, checkIn, checkOut, currency })
    })
      .then(r => r.json())
      .then(setQuote)
      .catch(() => setError(t('common.error')));
  }, [slug, checkIn, checkOut, currency, t]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, checkIn, checkOut, currency,
          guestName: form.fullName, guestEmail: form.email, guestPhone: form.phone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      // Redirect to Stripe's hosted checkout page (test mode)
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (!room) return <div className="container section">{t('common.loading')}</div>;

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>{t('booking.title')}</h1>

      <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <h3>{t('booking.summary')}</h3>
        <p>{room.name} — {checkIn} → {checkOut}</p>
        {quote && (
          <p>
            {quote.nights} × {format(room.pricePerNight)} = <strong>{format(quote.totalAzn)}</strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-3)' }}>
        <h3>{t('booking.guestDetails')}</h3>

        <div className="field">
          <label htmlFor="fullName">{t('booking.fullName')}</label>
          <input
            id="fullName" required value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="email">{t('booking.email')}</label>
          <input
            id="email" type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="phone">{t('booking.phone')}</label>
          <input
            id="phone" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <p className="booking__notice">{t('booking.testModeNotice')}</p>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? t('common.loading') : t('booking.payNow')}
        </button>
      </form>
    </div>
  );
}
