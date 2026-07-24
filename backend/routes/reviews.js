import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET /api/reviews?lang=ru
router.get('/', (req, res) => {
  const lang = ['ru', 'en', 'az'].includes(req.query.lang) ? req.query.lang : 'ru';
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({
    id: r.id,
    guestName: r.guest_name,
    rating: r.rating,
    comment: r[`comment_${lang}`],
    createdAt: r.created_at
  })));
});

export default router;
