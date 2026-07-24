import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import RoomCard from '../components/RoomCard.jsx';
import './Home.css';

export default function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    fetch(`/api/rooms?lang=${lang}`).then(r => r.json()).then(data => setRooms(data.slice(0, 3)));
  }, [lang]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    navigate(`/rooms?${params.toString()}`);
  }

  return (
    <div>
      <section className="hero">
        <div className="container hero__inner">
          <span className="eyebrow">AZBAKU · Business Hotel</span>
          <h1 className="hero__title">{t('home.heroTitle')}</h1>
          <p className="hero__subtitle">{t('home.heroSubtitle')}</p>

          <form className="hero__search" onSubmit={handleSearch}>
            <div className="field">
              <label htmlFor="hero-checkin">{t('home.checkIn')}</label>
              <input id="hero-checkin" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="hero-checkout">{t('home.checkOut')}</label>
              <input id="hero-checkout" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn--primary hero__search-btn">{t('home.search')}</button>
          </form>
        </div>
        <div className="hero__skyline" aria-hidden="true" />
      </section>

      <section className="section section--ink">
        <div className="container">
          <h2>{t('home.whyUsTitle')}</h2>
          <div className="grid grid--3">
            <div className="why-card">
              <h3>{t('home.whyUs1Title')}</h3>
              <p>{t('home.whyUs1Text')}</p>
            </div>
            <div className="why-card">
              <h3>{t('home.whyUs2Title')}</h3>
              <p>{t('home.whyUs2Text')}</p>
            </div>
            <div className="why-card">
              <h3>{t('home.whyUs3Title')}</h3>
              <p>{t('home.whyUs3Text')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>{t('home.featuredRooms')}</h2>
          <div className="grid grid--3">
            {rooms.map(room => <RoomCard key={room.id} room={room} />)}
          </div>
          <div className="home__view-all">
            <Link to="/rooms" className="btn btn--ghost">{t('home.viewAllRooms')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
