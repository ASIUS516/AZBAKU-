import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import './Navbar.css';

export default function Navbar() {
  const { t, lang, changeLang } = useLanguage();
  const { currency, changeCurrency, available } = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/rooms', label: t('nav.rooms') },
    { to: '/about', label: t('nav.about') },
    { to: '/gallery', label: t('nav.gallery') },
    { to: '/reviews', label: t('nav.reviews') },
    { to: '/contacts', label: t('nav.contacts') }
  ];

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__logo">AZBAKU</NavLink>

        <nav className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__controls">
          <select
            className="navbar__select"
            value={lang}
            onChange={e => changeLang(e.target.value)}
            aria-label="Language"
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
            <option value="az">AZ</option>
          </select>

          <select
            className="navbar__select"
            value={currency}
            onChange={e => changeCurrency(e.target.value)}
            aria-label={t('common.currency')}
          >
            {available.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <NavLink to="/rooms" className="btn btn--primary navbar__cta">{t('nav.bookNow')}</NavLink>

          <button
            className="navbar__burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
