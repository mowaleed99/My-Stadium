// =====================================================
// ملعب الجراش — Google Apps Script API v8 (SECURED)
// Sheet: Bookings
// Cols: id | date | startTime | endTime | duration | customerName | phone | status | price | notes | createdAt
// =====================================================

// Add valid hashes for security verification
const VALID_ADMIN_HASHES = [
  '1a11058fec1ea51a1f2fb97707ce9661788149bcb773cfc98fe8fb2d8967cba0', // mostafa@maleka2026
  'c0125c8ab374d2eb6ea97dfeb120e3f26054bd0aa8a5ea727b434340e3323f35', // yahea@captain2026
  '99da6babd1407ec6d3f698a7e9bef1ad6453ae62b8d7e0ab3ca7543a9500fd5d', // bebo@jarash2026
  '3189c64a4487256d750f9c23c617307773fba6d052da4e3157bd92394632fb76'  // jarash123
];

const SHEET_NAME = 'Bookings';
const COL = {
  ID:          1,  // A
  DATE:        2,  // B
  START_TIME:  3,  // C
  END_TIME:    4,  // D
  DURATION:    5,  // E
  CUSTOMER:    6,  // F
  PHONE:       7,  // G
  STATUS:      8,  // H
  PRICE:       9,  // I
  NOTES:       10, // J
  CREATED_AT:  11  // K
};

// ── Get or create sheet ───────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headerRange = sheet.getRange(1, 1, 1, 11);
    headerRange.setNumberFormat('@');
    headerRange.setValues([[
      'id', 'date', 'startTime', 'endTime', 'duration',
      'customerName', 'phone', 'status', 'price', 'notes', 'createdAt'
    ]]);
    headerRange.setFontWeight('bold').setBackground('#1a3a25').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── Date helper: Google Sheets auto-converts "YYYY-MM-DD" to Date objects ──
function readDate(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    return Utilities.formatDate(val, 'GMT+3', 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  return str.length >= 10 ? str.substring(0, 10) : str;
}

// ── Time helper: Google Sheets auto-converts "HH:MM" to Date objects (1899 epoch) ──
function readTime(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm');
  }
  const str = String(val).trim();
  return str.length >= 5 ? str.substring(0, 5) : str;
}

// ── Time to minutes helper (handles midnight wrap for overlap check) ──
function timeToMinutes(t) {
  if (!t) return 0;
  const parts = String(t).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  // Times 00:00–03:59 treated as 24:00–27:59 (past midnight)
  return (h < 4 ? h + 24 : h) * 60 + m;
}

// ── GET Handler ───────────────────────────────────────
function doGet(e) {
  const params = e.parameter;
  let result;
  try {
    if (params.action === 'getBookings') {
      result = getBookings(params.from, params.to);
    } else {
      result = { success: false, error: 'Unknown action: ' + params.action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST Handler ──────────────────────────────────────
function doPost(e) {
  let body;
  let result;
  try {
    body = JSON.parse(e.postData.contents);
    
    if (body.action === 'createBooking') {
      // If the booking is being set immediately to 'booked' (Admin Manual Booking),
      // it must have a valid admin hash. 'pending' bookings are allowed publicly.
      if (body.status === 'booked' && !VALID_ADMIN_HASHES.includes(body.adminHash)) {
        result = { success: false, error: 'Unauthorized. Valid Admin credentials required.' };
      } else {
        result = createBooking(body);
      }
    } else if (body.action === 'updateBookingStatus') {
      // Approving or rejecting a booking is strictly for admins.
      if (!VALID_ADMIN_HASHES.includes(body.adminHash)) {
        result = { success: false, error: 'Unauthorized. Valid Admin credentials required.' };
      } else {
        result = updateBookingStatus(body.id, body.status);
      }
    } else {
      result = { success: false, error: 'Unknown action: ' + body.action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── getBookings ───────────────────────────────────────
function getBookings(from, to) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return { success: true, data: [] };

  const rows = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const id           = String(row[COL.ID - 1]         || '').trim();
    const date         = readDate(row[COL.DATE - 1]);
    const startTime    = readTime(row[COL.START_TIME - 1]);
    const endTime      = readTime(row[COL.END_TIME - 1]);
    const duration     = parseFloat(row[COL.DURATION - 1])  || 0;
    const customerName = String(row[COL.CUSTOMER - 1]   || '').trim();
    const phone        = String(row[COL.PHONE - 1]      || '').trim();
    const status       = String(row[COL.STATUS - 1]     || '').trim();
    const price        = parseFloat(row[COL.PRICE - 1]) || 0;
    const notes        = String(row[COL.NOTES - 1]      || '').trim();
    const createdAt    = String(row[COL.CREATED_AT - 1] || '').trim();

    // Skip empty or header-like rows
    if (!id || !date || id === 'id') continue;

    // Filter by date range
    if (from && date < from) continue;
    if (to   && date > to)   continue;

    result.push({ id, date, startTime, endTime, duration, customerName, phone, status, price, notes, createdAt });
  }

  return { success: true, data: result };
}

// ── createBooking ─────────────────────────────────────
function createBooking(data) {
  const sheet = getSheet();

  // Server-side overlap validation
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    const newS = timeToMinutes(data.startTime);
    const newE = timeToMinutes(data.endTime);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowDate   = readDate(row[COL.DATE - 1]);
      const rowStatus = String(row[COL.STATUS - 1] || '').trim();

      if (rowDate !== data.date) continue;
      if (rowStatus === 'cancelled') continue;

      const existS = timeToMinutes(readTime(row[COL.START_TIME - 1]));
      const existE = timeToMinutes(readTime(row[COL.END_TIME - 1]));

      if (newS < existE && existS < newE) {
        return { success: false, error: 'overlap', message: 'هذه الفترة متداخلة مع حجز موجود' };
      }
    }
  }

  const id  = data.id || ('bk_' + Date.now());
  const now = new Date().toISOString();
  const nextRow = sheet.getLastRow() + 1;

  // Force ALL cells to plain text
  const range = sheet.getRange(nextRow, 1, 1, 11);
  range.setNumberFormat('@');
  range.setValues([[
    id,
    data.date         || '',
    data.startTime    || '',
    data.endTime      || '',
    String(data.duration   || 0),
    data.customerName || '',
    data.phone        || '',
    data.status       || 'pending',
    String(data.price || 0),
    data.notes        || '',
    data.createdAt    || now
  ]]);

  return { success: true, bookingId: id };
}

// ── updateBookingStatus ───────────────────────────────
function updateBookingStatus(id, status) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return { success: false, error: 'No bookings found' };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      sheet.getRange(i + 2, COL.STATUS).setValue(status);
      return { success: true };
    }
  }

  return { success: false, error: 'Booking not found: ' + id };
}

// ── One-time setup (run manually once if needed) ──────
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
  }
  const headerRange = sheet.getRange(1, 1, 1, 11);
  headerRange.setNumberFormat('@');
  headerRange.setValues([[
    'id', 'date', 'startTime', 'endTime', 'duration',
    'customerName', 'phone', 'status', 'price', 'notes', 'createdAt'
  ]]);
  headerRange.setFontWeight('bold').setBackground('#1a3a25').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  Logger.log('✅ Sheet setup complete!');
}
