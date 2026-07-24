import { Router } from 'express';
import Stripe from 'stripe';
import { db } from '../db/db.js';
import { countOverlappingBookings } from './rooms.js';

const router = Router();

// Stripe in TEST MODE. Put your test secret key in .env as STRIPE_SECRET_KEY (starts with sk_test_...)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20'
});

// POST /api/bookings/quote
// body: { slug, checkIn, checkOut, currency }
// Re-validates availability & price server-side (never trust the frontend's number)
router.post('/quote', (req, res) => {
  const { slug, checkIn, checkOut, currency = 'AZN' } = req.body;
  const room = db.prepare('SELECT * FROM rooms WHERE slug = ? AND is_active = 1').get(slug);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return res.status(400).json({ error: 'Invalid dates' });
  }

  const overlapping = countOverlappingBookings(room.id, checkIn, checkOut);
  if (overlapping >= room.total_units) {
    return res.status(409).json({ error: 'No units available for these dates' });
  }

  const rate = db.prepare('SELECT rate_to_azn FROM exchange_rates WHERE currency = ?').get(currency);
  if (!rate) return res.status(400).json({ error: 'Unsupported currency' });

  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  const totalAzn = nights * room.price_per_night;
  const totalConverted = +(totalAzn * rate.rate_to_azn).toFixed(2);

  res.json({
    nights,
    pricePerNightAzn: room.price_per_night,
    totalAzn: +totalAzn.toFixed(2),
    currency,
    totalInCurrency: totalConverted
  });
});

// POST /api/bookings/checkout
// body: { slug, checkIn, checkOut, currency, guestName, guestEmail, guestPhone }
// Creates a PENDING booking (holds the room) + a Stripe Checkout Session (test mode)
router.post('/checkout', async (req, res) => {
  const { slug, checkIn, checkOut, currency = 'AZN', guestName, guestEmail, guestPhone } = req.body;

  if (!guestName || !guestEmail) {
    return res.status(400).json({ error: 'guestName and guestEmail are required' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE slug = ? AND is_active = 1').get(slug);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return res.status(400).json({ error: 'Invalid dates' });
  }

  const overlapping = countOverlappingBookings(room.id, checkIn, checkOut);
  if (overlapping >= room.total_units) {
    return res.status(409).json({ error: 'No units available for these dates' });
  }

  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  const totalAzn = +(nights * room.price_per_night).toFixed(2);

  // Stripe requires a currency it supports for Checkout. AZN is not a Stripe-supported currency,
  // so for the actual Stripe charge we bill in USD (converted), while storing the AZN reference price.
  const usdRate = db.prepare('SELECT rate_to_azn FROM exchange_rates WHERE currency = ?').get('USD');
  const totalUsd = +(totalAzn * usdRate.rate_to_azn).toFixed(2);

  // Create the booking as PENDING first - this "holds" the room so nobody else can book it
  // while the guest is on the Stripe payment page.
  const insert = db.prepare(`
    INSERT INTO bookings (room_id, guest_name, guest_email, guest_phone, check_in, check_out, nights, total_price, currency, status)
    VALUES (?,?,?,?,?,?,?,?,?,'pending')
  `);
  const info = insert.run(room.id, guestName, guestEmail, guestPhone || null, checkIn, checkOut, nights, totalAzn, currency);
  const bookingId = info.lastInsertRowid;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: guestEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${room.name_en} — ${nights} night(s)`,
            description: `${checkIn} to ${checkOut}`
          },
          unit_amount: Math.round(totalUsd * 100) // Stripe wants cents
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-success?booking_id=${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-cancelled?booking_id=${bookingId}`,
      metadata: { booking_id: String(bookingId) }
    });

    db.prepare('UPDATE bookings SET stripe_session_id = ? WHERE id = ?').run(session.id, bookingId);

    res.json({ checkoutUrl: session.url, bookingId });
  } catch (err) {
    // Roll back the pending booking if Stripe session creation failed
    db.prepare('DELETE FROM bookings WHERE id = ?').run(bookingId);
    console.error('Stripe session creation failed:', err.message);
    res.status(500).json({ error: 'Payment session could not be created', details: err.message });
  }
});

// POST /api/bookings/webhook  (Stripe webhook - confirms payment)
// IMPORTANT: In server.js this route must use express.raw({type: 'application/json'}) BEFORE express.json()
// is applied globally, otherwise Stripe's signature verification will fail.
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      db.prepare(`
        UPDATE bookings SET status = 'confirmed', stripe_payment_intent = ?
        WHERE id = ?
      `).run(session.payment_intent, bookingId);
      console.log(`Booking ${bookingId} confirmed via Stripe webhook.`);
    }
  }

  // Optional: handle expired/cancelled sessions to release the held room
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'pending'`).run(bookingId);
    }
  }

  res.json({ received: true });
});

// GET /api/bookings/:id  (used by the booking-success page to show a confirmation summary)
router.get('/:id', (req, res) => {
  const booking = db.prepare(`
    SELECT b.*, r.name_ru, r.name_en, r.name_az, r.slug as room_slug
    FROM bookings b JOIN rooms r ON r.id = b.room_id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

export default router;
