import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/db.js';

const router = Router();

// Middleware: protect everything below this in the router except /login
export function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// POST /api/admin/login  { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.adminId = admin.id;
  res.json({ success: true, email: admin.email });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/admin/me  - check if currently logged in (used by frontend on page load)
router.get('/me', (req, res) => {
  if (req.session && req.session.adminId) {
    const admin = db.prepare('SELECT id, email FROM admin_users WHERE id = ?').get(req.session.adminId);
    return res.json({ loggedIn: true, admin });
  }
  res.json({ loggedIn: false });
});

// Everything below here requires a logged-in admin
router.use(requireAdmin);

// GET /api/admin/bookings - full booking list with room names, most recent first
router.get('/bookings', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, r.name_ru, r.name_en, r.slug as room_slug
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    ORDER BY b.created_at DESC
  `).all();
  res.json(rows);
});

// PATCH /api/admin/bookings/:id  { status }  - manually confirm/cancel a booking
router.patch('/bookings/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// GET /api/admin/rooms - all rooms including inactive ones
router.get('/rooms', (req, res) => {
  const rows = db.prepare('SELECT * FROM rooms ORDER BY price_per_night ASC').all();
  res.json(rows.map(r => ({ ...r, amenities: JSON.parse(r.amenities), photos: JSON.parse(r.photos) })));
});

// PUT /api/admin/rooms/:id - update price, capacity, active status, unit count etc.
router.put('/rooms/:id', (req, res) => {
  const allowedFields = [
    'price_per_night', 'capacity', 'size_sqm', 'total_units', 'is_active',
    'name_ru', 'name_en', 'name_az', 'description_ru', 'description_en', 'description_az'
  ];
  const updates = [];
  const params = [];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }
  if (req.body.amenities) {
    updates.push('amenities = ?');
    params.push(JSON.stringify(req.body.amenities));
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// GET /api/admin/dashboard-stats - quick summary numbers for the admin homepage
router.get('/dashboard-stats', (req, res) => {
  const totalBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'`).get().c;
  const revenue = db.prepare(`SELECT SUM(total_price) as s FROM bookings WHERE status = 'confirmed'`).get().s || 0;
  const upcoming = db.prepare(`
    SELECT COUNT(*) as c FROM bookings
    WHERE status = 'confirmed' AND check_in >= date('now')
  `).get().c;
  const pendingCount = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'`).get().c;

  res.json({ totalConfirmedBookings: totalBookings, totalRevenueAzn: revenue, upcomingStays: upcoming, pendingPayments: pendingCount });
});

export default router;
