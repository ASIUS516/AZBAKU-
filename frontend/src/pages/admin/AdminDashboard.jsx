import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [editingPrices, setEditingPrices] = useState({});

  async function loadAll() {
    const [statsRes, bookingsRes, roomsRes] = await Promise.all([
      fetch('/api/admin/dashboard-stats', { credentials: 'include' }),
      fetch('/api/admin/bookings', { credentials: 'include' }),
      fetch('/api/admin/rooms', { credentials: 'include' })
    ]);
    if (statsRes.status === 401) { navigate('/admin/login'); return; }
    setStats(await statsRes.json());
    setBookings(await bookingsRes.json());
    setRooms(await roomsRes.json());
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateBookingStatus(id, status) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    loadAll();
  }

  async function saveRoomPrice(roomId) {
    const newPrice = editingPrices[roomId];
    if (newPrice === undefined) return;
    await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ price_per_night: parseFloat(newPrice) })
    });
    loadAll();
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login');
  }

  if (!stats) return <div className="container section">{t('common.loading')}</div>;

  return (
    <div className="container section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('admin.dashboard')}</h1>
        <button className="btn btn--ghost" onClick={handleLogout}>{t('admin.logout')}</button>
      </div>

      <div className="grid grid--3" style={{ marginBottom: 'var(--space-4)' }}>
        <StatCard label={t('admin.totalRevenue')} value={`${stats.totalRevenueAzn} ₼`} />
        <StatCard label={t('admin.confirmedBookings')} value={stats.totalConfirmedBookings} />
        <StatCard label={t('admin.upcomingStays')} value={stats.upcomingStays} />
      </div>

      <h2>{t('admin.bookingsManagement')}</h2>
      <div className="card" style={{ overflowX: 'auto', marginBottom: 'var(--space-5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-line)' }}>
              <Th>{t('admin.guest')}</Th>
              <Th>{t('admin.room')}</Th>
              <Th>{t('admin.dates')}</Th>
              <Th>{t('admin.price')}</Th>
              <Th>{t('admin.status')}</Th>
              <Th>{t('admin.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
                <Td>{b.guest_name}<br /><small style={{ color: 'var(--color-slate-light)' }}>{b.guest_email}</small></Td>
                <Td>{b.name_ru}</Td>
                <Td>{b.check_in} → {b.check_out}</Td>
                <Td>{b.total_price} {b.currency}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td>
                  {b.status !== 'confirmed' && (
                    <button className="btn btn--ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}>✓</button>
                  )}
                  {b.status !== 'cancelled' && (
                    <button className="btn btn--ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', marginLeft: '0.4rem' }}
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}>✕</button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t('admin.roomsManagement')}</h2>
      <div className="grid grid--3">
        {rooms.map(room => (
          <div key={room.id} className="card" style={{ padding: 'var(--space-3)' }}>
            <h3>{room.name_ru}</h3>
            <div className="field">
              <label>{t('admin.price')} (AZN)</label>
              <input
                type="number"
                defaultValue={room.price_per_night}
                onChange={e => setEditingPrices(p => ({ ...p, [room.id]: e.target.value }))}
              />
            </div>
            <button className="btn btn--primary" onClick={() => saveRoomPrice(room.id)}>{t('admin.savePrice')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-ink)' }}>{value}</div>
      <div style={{ color: 'var(--color-slate-light)', fontSize: 'var(--fs-small)' }}>{label}</div>
    </div>
  );
}
function Th({ children }) { return <th style={{ padding: '0.6rem', fontSize: '0.8rem', color: 'var(--color-slate-light)' }}>{children}</th>; }
function Td({ children }) { return <td style={{ padding: '0.6rem', fontSize: '0.9rem' }}>{children}</td>; }
function StatusBadge({ status }) {
  const cls = status === 'confirmed' ? 'badge--success' : status === 'pending' ? 'badge--pending' : 'badge--cancelled';
  return <span className={`badge ${cls}`}>{status}</span>;
}
