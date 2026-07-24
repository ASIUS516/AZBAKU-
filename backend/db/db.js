import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'hotel.db');

export const db = new DatabaseSync(dbPath);

// ---------- SCHEMA ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_az TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_az TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    capacity INTEGER NOT NULL,
    size_sqm INTEGER NOT NULL,
    amenities TEXT NOT NULL,     -- JSON array of amenity keys
    photos TEXT NOT NULL,        -- JSON array of photo URLs/placeholders
    total_units INTEGER NOT NULL DEFAULT 1, -- how many physical rooms of this type exist
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    check_in TEXT NOT NULL,    -- ISO date YYYY-MM-DD
    check_out TEXT NOT NULL,   -- ISO date YYYY-MM-DD
    nights INTEGER NOT NULL,
    total_price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AZN',
    status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment_ru TEXT,
    comment_en TEXT,
    comment_az TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exchange_rates (
    currency TEXT PRIMARY KEY,
    rate_to_azn REAL NOT NULL  -- how many AZN = 1 unit of this currency's base (we store AZN->currency multiplier instead, see seed)
  );
`);

// ---------- SEED (only if empty) ----------
const roomCount = db.prepare('SELECT COUNT(*) as c FROM rooms').get().c;

if (roomCount === 0) {
  const insertRoom = db.prepare(`
    INSERT INTO rooms
      (slug, type, name_ru, name_en, name_az, description_ru, description_en, description_az,
       price_per_night, capacity, size_sqm, amenities, photos, total_units)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const rooms = [
    {
      slug: 'standard-single',
      type: 'standard_single',
      name_ru: 'Стандарт одноместный', name_en: 'Standard Single', name_az: 'Standart Tək',
      description_ru: 'Компактный уютный номер для одного гостя с рабочей зоной и панорамным окном на город.',
      description_en: 'A compact, comfortable room for a solo guest, with a work desk and panoramic city window.',
      description_az: 'Tək qonaq üçün rahat otaq, iş masası və şəhərə baxan geniş pəncərə ilə.',
      price: 90, capacity: 1, size: 18,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe'],
      photos: ['/images/rooms/standard-single-1.jpg', '/images/rooms/standard-single-2.jpg'],
      total_units: 6
    },
    {
      slug: 'standard-double',
      type: 'standard_double',
      name_ru: 'Стандарт двухместный', name_en: 'Standard Double', name_az: 'Standart İkilik',
      description_ru: 'Просторный номер с двуспальной кроватью, идеален для пары или короткой командировки вдвоём.',
      description_en: 'A spacious room with a double bed, ideal for couples or a short business trip together.',
      description_az: 'İki nəfərlik geniş çarpayı olan otaq, cütlüklər və ya birgə ezamiyyət üçün ideal.',
      price: 120, capacity: 2, size: 24,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe', 'minibar'],
      photos: ['/images/rooms/standard-double-1.jpg', '/images/rooms/standard-double-2.jpg'],
      total_units: 8
    },
    {
      slug: 'business-room',
      type: 'business',
      name_ru: 'Business Room', name_en: 'Business Room', name_az: 'Biznes Otaq',
      description_ru: 'Номер для командировочных: увеличенный рабочий стол, быстрый Wi-Fi, доступ в бизнес-лаунж и завтрак включён.',
      description_en: 'Built for business travel: a larger desk, high-speed Wi-Fi, business lounge access and breakfast included.',
      description_az: 'Ezamiyyət üçün nəzərdə tutulub: böyük iş masası, sürətli Wi-Fi, biznes lounge girişi və səhər yeməyi daxildir.',
      price: 165, capacity: 2, size: 28,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe', 'minibar', 'lounge_access', 'breakfast'],
      photos: ['/images/rooms/business-1.jpg', '/images/rooms/business-2.jpg'],
      total_units: 10
    },
    {
      slug: 'executive-suite',
      type: 'executive_suite',
      name_ru: 'Executive Suite', name_en: 'Executive Suite', name_az: 'Executive Suite',
      description_ru: 'Люкс с отдельной гостиной зоной, видом на Flame Towers и премиальным набором удобств для длительного проживания.',
      description_en: 'A suite with a separate living area, Flame Towers views and a premium amenity set for longer stays.',
      description_az: 'Ayrı oturma zonası, Alov Qülləsi mənzərəsi və uzunmüddətli qalma üçün premium imkanlarla suite.',
      price: 260, capacity: 3, size: 42,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe', 'minibar', 'lounge_access', 'breakfast', 'living_room', 'city_view'],
      photos: ['/images/rooms/executive-1.jpg', '/images/rooms/executive-2.jpg'],
      total_units: 5
    },
    {
      slug: 'presidential-suite',
      type: 'presidential_suite',
      name_ru: 'Presidential Suite', name_en: 'Presidential Suite', name_az: 'Prezident Suite',
      description_ru: 'Наш флагманский номер: отдельная столовая, кабинет для переговоров, терраса и персональный дворецкий по запросу.',
      description_en: 'Our flagship room: a separate dining area, private meeting study, terrace, and butler service on request.',
      description_az: 'Flaqman otağımız: ayrı yemək zonası, danışıqlar üçün kabinet, terras və tələb üzrə butler xidməti.',
      price: 480, capacity: 4, size: 70,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe', 'minibar', 'lounge_access', 'breakfast', 'living_room', 'city_view', 'terrace', 'butler'],
      photos: ['/images/rooms/presidential-1.jpg', '/images/rooms/presidential-2.jpg'],
      total_units: 2
    },
    {
      slug: 'connecting-rooms',
      type: 'connecting',
      name_ru: 'Connecting Rooms (семейные)', name_en: 'Connecting Rooms (Family)', name_az: 'Birləşən Otaqlar (Ailə)',
      description_ru: 'Два смежных номера с общей дверью — удобно для семей или коллег, которым нужно и общее пространство, и приватность.',
      description_en: 'Two adjoining rooms with a connecting door — convenient for families or colleagues who need shared space and privacy.',
      description_az: 'Ortaq qapı ilə birləşən iki otaq — həm ümumi məkan, həm də məxfilik istəyən ailələr üçün rahatdır.',
      price: 220, capacity: 4, size: 46,
      amenities: ['wifi', 'ac', 'desk', 'tv', 'safe', 'minibar', 'breakfast'],
      photos: ['/images/rooms/connecting-1.jpg', '/images/rooms/connecting-2.jpg'],
      total_units: 4
    }
  ];

  for (const r of rooms) {
    insertRoom.run(
      r.slug, r.type, r.name_ru, r.name_en, r.name_az,
      r.description_ru, r.description_en, r.description_az,
      r.price, r.capacity, r.size,
      JSON.stringify(r.amenities), JSON.stringify(r.photos), r.total_units
    );
  }

  // Seed a couple of reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (guest_name, rating, comment_ru, comment_en, comment_az)
    VALUES (?,?,?,?,?)
  `);
  insertReview.run('Elvin M.', 5,
    'Отличный отель для командировки, до бизнес-центра 10 минут пешком, завтрак прекрасный.',
    'Great hotel for a business trip, 10 minutes on foot to the business district, breakfast was excellent.',
    'Ezamiyyət üçün əla otel, biznes mərkəzinə piyada 10 dəqiqə, səhər yeməyi əla idi.'
  );
  insertReview.run('Anna K.', 4,
    'Чисто, тихо, персонал отзывчивый. Wi-Fi мог бы быть чуть быстрее в Executive Suite.',
    'Clean, quiet, responsive staff. Wi-Fi could be a bit faster in the Executive Suite.',
    'Təmiz, sakit, işçilər diqqətli. Executive Suite-də Wi-Fi bir az sürətli ola bilərdi.'
  );

  // Seed exchange rates (base = AZN). Hardcoded for demo; can later be swapped for a live API.
  const insertRate = db.prepare(`INSERT INTO exchange_rates (currency, rate_to_azn) VALUES (?, ?)`);
  insertRate.run('AZN', 1);
  insertRate.run('USD', 0.59);   // 1 AZN ≈ 0.59 USD (demo static rate)
  insertRate.run('EUR', 0.54);   // 1 AZN ≈ 0.54 EUR (demo static rate)

  console.log('Seeded rooms, reviews and exchange rates.');
}

// Seed a default admin user if none exists (email: admin@azbakuhotel.com / password: ChangeMe123!)
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
if (adminCount === 0) {
  const hash = bcrypt.hashSync('ChangeMe123!', 10);
  db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)')
    .run('admin@azbakuhotel.com', hash);
  console.log('Seeded default admin user -> admin@azbakuhotel.com / ChangeMe123! (CHANGE THIS)');
}
