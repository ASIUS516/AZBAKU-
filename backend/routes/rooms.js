import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

function serializeRoom(row, lang = 'ru') {
  lang = ['ru', 'en', 'az'].includes(lang) ? lang : 'ru';
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    name: row[`name_${lang}`],
    description: row[`description_${lang}`],
    pricePerNight: row.price_per_night,
    capacity: row.capacity,
    sizeSqm: row.size_sqm,
    amenities: JSON.parse(row.amenities),
    photos: JSON.parse(row.photos),
    totalUnits: row.total_units
  };
}

// GET /api/rooms?lang=ru
router.get('/', (req, res) => {
  const lang = req.query.lang || 'ru';
  const rows = db.prepare('SELECT * FROM rooms WHERE is_active = 1 ORDER BY price_per_night ASC').all();
  res.json(rows.map(r => serializeRoom(r, lang)));
});

// GET /api/rooms/:slug?lang=ru
router.get('/:slug', (req, res) => {
  const lang = req.query.lang || 'ru';
  const row = db.prepare('SELECT * FROM rooms WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Room not found' });
  res.json(serializeRoom(row, lang));
});

// Helper: count overlapping CONFIRMED/PENDING bookings for a room type in a date range.
// Dates are stored as ISO strings (YYYY-MM-DD). Overlap rule: existing.check_in < new.check_out AND existing.check_out > new.check_in
export function countOverlappingBookings(roomId, checkIn, checkOut, excludeBookingId = null) {
  let query = `
    SELECT COUNT(*) as c FROM bookings
    WHERE room_id = ?
      AND status IN ('pending', 'confirmed')
      AND check_in < ?
      AND check_out > ?
  `;
  const params = [roomId, checkOut, checkIn];
  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }
  return db.prepare(query).get(...params).c;
}

// GET /api/rooms/:slug/availability?checkIn=2026-08-01&checkOut=2026-08-05
router.get('/:slug/availability', (req, res) => {
  const { checkIn, checkOut } = req.query;
  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: 'checkIn and checkOut are required (YYYY-MM-DD)' });
  }
  if (checkOut <= checkIn) {
    return res.status(400).json({ error: 'checkOut must be after checkIn' });
  }
  const room = db.prepare('SELECT * FROM rooms WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const overlapping = countOverlappingBookings(room.id, checkIn, checkOut);
  const unitsLeft = room.total_units - overlapping;
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);

  res.json({
    available: unitsLeft > 0,
    unitsLeft: Math.max(unitsLeft, 0),
    nights,
    totalPrice: +(nights * room.price_per_night).toFixed(2)
  });
});

// GET /api/rooms/:slug/booked-dates?year=2026&month=8
// Returns which individual dates in the month are FULLY booked (no units left) - used to grey out the calendar
router.get('/:slug/booked-dates', (req, res) => {
  const { year, month } = req.query; // month = 1-12
  const room = db.prepare('SELECT * FROM rooms WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const y = parseInt(year, 10);
  const m = parseInt(month, 10); // 1-indexed
  const daysInMonth = new Date(y, m, 0).getDate();

  const fullyBookedDates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const nextDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
    const overlapping = countOverlappingBookings(room.id, dateStr, nextDateStr);
    if (overlapping >= room.total_units) {
      fullyBookedDates.push(dateStr);
    }
  }
  res.json({ fullyBookedDates });
});

export default router;
