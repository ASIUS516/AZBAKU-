import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './Footer.css';

// Replace this with the hotel's real coordinates/address when adapting for a real client.
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=40.3777,49.8920';
const GOOGLE_MAPS_EMBED_SRC = 'https://maps.google.com/maps?q=40.3777,49.8920&z=15&output=embed';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__logo">AZBAKU</div>
          <p className="footer__tagline">{t('footer.tagline')}</p>
        </div>

        <div>
          <h3 className="footer__heading">{t('footer.quickLinks')}</h3>
          <ul className="footer__links">
            <li><Link to="/rooms">{t('nav.rooms')}</Link></li>
            <li><Link to="/about">{t('nav.about')}</Link></li>
            <li><Link to="/reviews">{t('nav.reviews')}</Link></li>
            <li><Link to="/contacts">{t('nav.contacts')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="footer__heading">{t('footer.contactUs')}</h3>
          <p>+994 12 000 00 00</p>
          <p>stay@azbakuhotel.com</p>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">{t('contacts.mapLink')} →</a>
        </div>

        <div className="footer__map">
          <iframe
            title="AZBAKU location"
            src={GOOGLE_MAPS_EMBED_SRC}
            width="100%"
            height="140"
            style={{ border: 0, borderRadius: 'var(--radius-sm)' }}
            loading="lazy"
          />
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} AZBAKU. {t('footer.rightsReserved')}</span>
        <span className="footer__notice">{t('footer.portfolioNotice')}</span>
      </div>
    </footer>
  );
}
