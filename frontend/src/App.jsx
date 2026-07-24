import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import RoomDetail from './pages/RoomDetail.jsx';
import Booking from './pages/Booking.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import BookingCancelled from './pages/BookingCancelled.jsx';
import About from './pages/About.jsx';
import Gallery from './pages/Gallery.jsx';
import Reviews from './pages/Reviews.jsx';
import Contacts from './pages/Contacts.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import { useLanguage } from './i18n/LanguageContext.jsx';

function AdminGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | in | out

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setStatus(data.loggedIn ? 'in' : 'out'));
  }, []);

  if (status === 'checking') return <div className="container section">…</div>;
  if (status === 'out') return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:slug" element={<RoomDetail />} />
          <Route path="/booking/:slug" element={<Booking />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/booking-cancelled" element={<BookingCancelled />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contacts" element={<Contacts />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminGate><AdminDashboard /></AdminGate>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
    </div>
  );
}
