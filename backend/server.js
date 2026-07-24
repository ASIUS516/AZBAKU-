import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';

import './db/db.js'; // initializes + seeds the database on first run
import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';
import reviewsRouter from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// IMPORTANT: the Stripe webhook route needs the RAW body (not JSON-parsed) to verify signatures.
// So we mount it BEFORE express.json() runs on the rest of the app.
app.post('/api/bookings/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // only https-only cookies in production
    maxAge: 1000 * 60 * 60 * 8 // 8 hour admin session
  }
}));

app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reviews', reviewsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`AZBAKU Hotel backend running on http://localhost:${PORT}`);
});
