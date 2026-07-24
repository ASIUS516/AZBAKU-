import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './BookingCalendar.css';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_LABELS = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  az: ['B.', 'B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən']
};
const MONTH_LABELS = {
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  az: ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr']
};

// Determines a subtle seasonal accent class purely for visual polish (requested by the client).
function seasonClassForMonth(monthIndex) {
  if ([11, 0, 1].includes(monthIndex)) return 'calendar--winter';
  if ([2, 3, 4].includes(monthIndex)) return 'calendar--spring';
  if ([5, 6, 7].includes(monthIndex)) return 'calendar--summer';
  return 'calendar--autumn';
}

function toISODate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function BookingCalendar({ roomSlug, onRangeChange }) {
  const { lang, t } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [bookedDates, setBookedDates] = useState(new Set());
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBookedDates = useCallback(async () => {
    if (!roomSlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomSlug}/booked-dates?year=${viewYear}&month=${viewMonth + 1}`);
      const data = await res.json();
      setBookedDates(new Set(data.fullyBookedDates || []));
    } catch (err) {
      console.error('Failed to load booked dates', err);
    } finally {
      setLoading(false);
    }
  }, [roomSlug, viewYear, viewMonth]);

  useEffect(() => { fetchBookedDates(); }, [fetchBookedDates]);

  useEffect(() => {
    onRangeChange?.({ checkIn, checkOut });
  }, [checkIn, checkOut, onRangeChange]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  function isPast(iso) { return iso < todayISO; }
  function isBooked(iso) { return bookedDates.has(iso); }
  function isInRange(iso) {
    if (!checkIn || !checkOut) return false;
    return iso > checkIn && iso < checkOut;
  }

  function handleDayClick(iso) {
    if (isPast(iso) || isBooked(iso)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // start a new selection
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    // we have a checkIn but no checkOut yet
    if (iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut(null);
      return;
    }
    // Make sure no booked date falls inside the chosen range
    let hasBookedInBetween = false;
    let d = new Date(checkIn);
    const end = new Date(iso);
    while (d < end) {
      const dIso = d.toISOString().slice(0, 10);
      if (bookedDates.has(dIso)) { hasBookedInBetween = true; break; }
      d.setDate(d.getDate() + 1);
    }
    if (hasBookedInBetween) {
      // restart selection from this date instead of allowing an invalid range
      setCheckIn(iso);
      setCheckOut(null);
    } else {
      setCheckOut(iso);
    }
  }

  function changeMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={`calendar ${seasonClassForMonth(viewMonth)}`}>
      <div className="calendar__header">
        <button type="button" className="calendar__nav" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
        <div className="calendar__title">{MONTH_LABELS[lang][viewMonth]} {viewYear}</div>
        <button type="button" className="calendar__nav" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
      </div>

      <div className="calendar__weekdays">
        {WEEKDAY_LABELS[lang].map((w, i) => <div key={WEEKDAY_KEYS[i]} className="calendar__weekday">{w}</div>)}
      </div>

      <div className={`calendar__grid ${loading ? 'calendar__grid--loading' : ''}`}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={`empty-${idx}`} className="calendar__cell calendar__cell--empty" />;
          const iso = toISODate(viewYear, viewMonth, d);
          const past = isPast(iso);
          const booked = isBooked(iso);
          const selectedStart = iso === checkIn;
          const selectedEnd = iso === checkOut;
          const inRange = isInRange(iso);

          const classes = ['calendar__cell'];
          if (past) classes.push('calendar__cell--past');
          if (booked && !past) classes.push('calendar__cell--booked');
          if (selectedStart || selectedEnd) classes.push('calendar__cell--selected');
          if (inRange) classes.push('calendar__cell--in-range');

          return (
            <button
              type="button"
              key={iso}
              className={classes.join(' ')}
              disabled={past || booked}
              onClick={() => handleDayClick(iso)}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="calendar__legend">
        <span><i className="calendar__swatch calendar__swatch--available" /> {t('calendar.available')}</span>
        <span><i className="calendar__swatch calendar__swatch--booked" /> {t('calendar.booked')}</span>
        <span><i className="calendar__swatch calendar__swatch--selected" /> {t('calendar.selected')}</span>
      </div>
    </div>
  );
}
