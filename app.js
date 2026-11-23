'use strict';

/* CampusConnect — self-contained working prototype.
   Static app + mock backend in localStorage. No build step, no server.
   The password hash here is a DEMO hash so the login module works offline;
   the assignment report specifies PBKDF2-SHA256 / Firebase Auth in production. */

const STORAGE_KEY = 'campusconnect_db_v1';
const SESSION_KEY = 'campusconnect_session_v1';
const FEST_START  = '2026-12-06T10:00:00';
const DEMO_SALT   = 'cc-demo-salt';

/* ------------------------------------------------------------------ utils */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function demoHash(password, salt) {
  let h = 2166136261 ^ salt.length;
  const s = salt + '|' + password;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let i = 0; i < 500; i++) h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h >>> 0).toString(16).padStart(8, '0');
}
const nextId = arr => arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtDate(ds) {
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}
const dayNum = ds => String(ds).slice(8, 10);
const monthShort = ds => new Date(ds + 'T00:00:00').toLocaleString('en', { month: 'short' }).toUpperCase();
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 172800) return 'Yesterday';
  return `${Math.floor(s / 86400)} days ago`;
}
const toMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/* ------------------------------------------------------------- seed / db */
function seedDB() {
  const ph = p => demoHash(p, DEMO_SALT);
  const ago = h => new Date(Date.now() - h * 3600 * 1000).toISOString();
  return {
    users: [
      { id: 1, name: 'Swati',    email: 'student@college.edu', collegeId: '2026CS001', role: 'Student',      societyId: null, salt: DEMO_SALT, passwordHash: ph('campus123') },
      { id: 2, name: 'Aarav',    email: 'head@college.edu',     collegeId: '2026CS014', role: 'SocietyHead', societyId: 3,    salt: DEMO_SALT, passwordHash: ph('campus123') },
      { id: 3, name: 'Dr. Mehta',email: 'admin@college.edu',    collegeId: 'STAFF002',  role: 'Admin',       societyId: null, salt: DEMO_SALT, passwordHash: ph('campus123') },
      { id: 4, name: 'Rohan',    email: 'head2@college.edu',    collegeId: '2026CS021', role: 'SocietyHead', societyId: 1,    salt: DEMO_SALT, passwordHash: ph('campus123') }
    ],
    societies: [
      { id: 1, name: 'Coding Society',       category: 'Technical', emoji: '💻', color: 'var(--navy)',   description: 'Code, compete and build things together.', headUserId: 4, followerIds: [1, 2] },
      { id: 2, name: 'Dramatics Society',    category: 'Cultural',  emoji: '🎭', color: 'var(--coral)',  description: 'Theatre, street plays and stage productions.', headUserId: null, followerIds: [1] },
      { id: 3, name: 'Debate Society',       category: 'Cultural',  emoji: '🎤', color: 'var(--teal)',   description: 'Debates, orientations and public speaking.', headUserId: 2, followerIds: [1, 2] },
      { id: 4, name: 'Photography Society',  category: 'Cultural',  emoji: '📷', color: '#8a5c00',       description: 'Walks, workshops and photo exhibitions.', headUserId: null, followerIds: [1] },
      { id: 5, name: 'Design Society',       category: 'Cultural',  emoji: '🎨', color: 'var(--navy-3)', description: 'Design talks, poster jams and the Design Expo.', headUserId: null, followerIds: [] },
      { id: 6, name: 'Music Society',        category: 'Cultural',  emoji: '🎵', color: 'var(--coral)',  description: 'Bands, open mics and the annual battle of bands.', headUserId: null, followerIds: [1] }
    ],
    events: [
      { id: 1, societyId: 3, title: 'Freshers Orientation', description: "Kick off the year with the Debate Society — meet the team, hear about this year's tournaments and sign up for tryouts.", venue: 'Seminar Hall 2', date: '2026-11-28', time: '14:00', seatLimit: 150, status: 'Approved', rejectionReason: '', poster: '🎤', baseInterested: 124, baseRegistered: 96, createdBy: 2, createdAt: ago(120) },
      { id: 2, societyId: 1, title: 'Hackathon 2026', description: 'A 24-hour build sprint with mentors, prizes and a demo stage. Teams of up to four students.', venue: 'Computer Lab 3', date: '2026-12-02', time: '10:00', seatLimit: 250, status: 'Approved', rejectionReason: '', poster: '💻', baseInterested: 213, baseRegistered: 183, createdBy: 4, createdAt: ago(110) },
      { id: 3, societyId: 4, title: 'Photography Walk', description: 'Golden-hour walk around the heritage block. Bring your own camera; beginners welcome.', venue: 'Main Ground', date: '2026-11-29', time: '16:30', seatLimit: 80, status: 'Approved', rejectionReason: '', poster: '📷', baseInterested: 64, baseRegistered: 51, createdBy: null, createdAt: ago(96) },
      { id: 4, societyId: 6, title: 'Battle of Bands', description: 'Live music, four bands, one stage. The biggest night of the fest week.', venue: 'Main Ground', date: '2026-12-06', time: '15:00', seatLimit: 200, status: 'Approved', rejectionReason: '', poster: '🎸', baseInterested: 310, baseRegistered: 200, createdBy: 2, createdAt: ago(80) },
      { id: 5, societyId: 2, title: 'Street Play', description: 'An original street play on campus life by the Dramatics Society.', venue: 'Auditorium', date: '2026-12-09', time: '13:00', seatLimit: 120, status: 'Approved', rejectionReason: '', poster: '🎭', baseInterested: 88, baseRegistered: 70, createdBy: null, createdAt: ago(60) },
      { id: 6, societyId: 3, title: 'Inter-Society Debate', description: 'A friendly inter-society debate on the motion: "Technology brings students closer."', venue: 'Seminar Hall 1', date: '2026-12-12', time: '11:00', seatLimit: 100, status: 'Pending', rejectionReason: '', poster: '🎤', baseInterested: 0, baseRegistered: 0, createdBy: 2, createdAt: ago(5) },
      { id: 7, societyId: 1, title: 'Competitive Programming Workshop', description: 'Problem-solving patterns and a live contest for beginners.', venue: 'Computer Lab 2', date: '2026-12-14', time: '09:30', seatLimit: 60, status: 'Pending', rejectionReason: '', poster: '💻', baseInterested: 0, baseRegistered: 0, createdBy: 4, createdAt: ago(3) },
      { id: 8, societyId: 5, title: 'Design Expo', description: 'Posters, prototypes and an open critique wall.', venue: 'Exhibition Hall', date: '2026-12-16', time: '10:00', seatLimit: 150, status: 'Rejected', rejectionReason: 'Venue clashes with the university examination schedule.', poster: '🎨', baseInterested: 0, baseRegistered: 0, createdBy: 4, createdAt: ago(30) }
    ],
    registrations: [
      { id: 1, eventId: 1, userId: 1, status: 'Confirmed',  registeredAt: ago(70) },
      { id: 2, eventId: 2, userId: 1, status: 'Confirmed',  registeredAt: ago(50) },
      { id: 3, eventId: 3, userId: 1, status: 'Confirmed',  registeredAt: ago(40) },
      { id: 4, eventId: 4, userId: 1, status: 'Waitlisted', registeredAt: ago(20) },
      { id: 5, eventId: 2, userId: 2, status: 'Confirmed',  registeredAt: ago(35) }
    ],
    notifications: [
      { id: 1, userId: 1, eventId: 2, type: 'Change',   message: 'Venue changed for Hackathon 2026: Lab 3 → Auditorium', sentAt: ago(2),  readFlag: false },
      { id: 2, userId: 1, eventId: 2, type: 'NewEvent', message: 'Coding Society added Competitive Programming Workshop', sentAt: ago(5), readFlag: false },
      { id: 3, userId: 1, eventId: 1, type: 'Reminder', message: 'Freshers Orientation starts tomorrow at 2:00 PM', sentAt: ago(26), readFlag: true },
      { id: 4, userId: 1, eventId: null, type: 'Fest',   message: 'Day 1 schedule for Fest 2026 is now live', sentAt: ago(48), readFlag: true },
      { id: 5, userId: 3, eventId: 6, type: 'Result',   message: 'New event pending approval: Inter-Society Debate', sentAt: ago(5), readFlag: false },
      { id: 6, userId: 3, eventId: 7, type: 'Result',   message: 'New event pending approval: Competitive Programming Workshop', sentAt: ago(3), readFlag: false },
      { id: 7, userId: 2, eventId: 1, type: 'Result',   message: 'Your event Freshers Orientation is live in the student feed', sentAt: ago(100), readFlag: true }
    ],
    festSchedule: [
      { id: 1, day: 1, slotTime: '10:00', activity: '🎤 Opening Ceremony',   venue: 'Auditorium' },
      { id: 2, day: 1, slotTime: '12:00', activity: '💻 Hackathon',          venue: 'Computer Lab 3' },
      { id: 3, day: 1, slotTime: '15:00', activity: '🎸 Battle of Bands',    venue: 'Main Ground' },
      { id: 4, day: 1, slotTime: '17:00', activity: '💃 Dance Competition',  venue: 'Auditorium' },
      { id: 5, day: 2, slotTime: '10:00', activity: '🤖 Robotics Showcase',  venue: 'Lab 1' },
      { id: 6, day: 2, slotTime: '13:00', activity: '🧠 Quiz Competition',   venue: 'Seminar Hall 2' },
      { id: 7, day: 2, slotTime: '16:00', activity: '🎭 Drama Fest',         venue: 'Auditorium' },
      { id: 8, day: 3, slotTime: '10:00', activity: '📷 Photography Expo',   venue: 'Exhibition Hall' },
      { id: 9, day: 3, slotTime: '14:00', activity: '👗 Fashion Show',       venue: 'Main Ground' },
      { id: 10, day: 3, slotTime: '18:00', activity: '🏆 Closing Ceremony',  venue: 'Auditorium' }
    ]
  };
}
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const parsed = JSON.parse(raw); if (parsed && Array.isArray(parsed.users)) return parsed; }
  } catch (e) { /* file:// privacy modes fall back to in-memory only */ }
  return seedDB();
}
let db = loadDB();
function saveDB() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { /* in-memory */ } }
function getSession() { try { return Number(localStorage.getItem(SESSION_KEY)) || null; } catch (e) { return null; } }
function setSession(id) { try { id ? localStorage.setItem(SESSION_KEY, String(id)) : localStorage.removeItem(SESSION_KEY); } catch (e) {} }
function currentUser() { const id = getSession(); return db.users.find(u => u.id === id) || null; }
function roleOf(u) { return u && u.role === 'SocietyHead' ? 'head' : u && u.role === 'Admin' ? 'admin' : 'student'; }
const homeForRole = role => role === 'head' ? 'headdashboard' : role === 'admin' ? 'admindashboard' : 'home';

/* --------------------------------------------------------- domain helpers */
const societyOf = e => db.societies.find(s => s.id === e.societyId);
const regFor = (eid, uid) => db.registrations.find(r => r.eventId === eid && r.userId === uid);
const confirmedCount = e => e.baseRegistered + db.registrations.filter(r => r.eventId === e.id && r.status === 'Confirmed').length;
const waitCount = e => db.registrations.filter(r => r.eventId === e.id && r.status === 'Waitlisted').length;
const interestCount = e => e.baseInterested + db.registrations.filter(r => r.eventId === e.id && r.status !== 'Cancelled').length;
const seatsLeft = e => Math.max(0, e.seatLimit - confirmedCount(e));
function addNotification(userId, eventId, type, message) {
  db.notifications.unshift({ id: nextId(db.notifications), userId, eventId, type, message, sentAt: new Date().toISOString(), readFlag: false });
}
function overlaps(a, b) {
  return a.date === b.date && String(a.venue).trim().toLowerCase() === String(b.venue).trim().toLowerCase()
    && Math.abs(toMinutes(a.time) - toMinutes(b.time)) < 60;
}
function checkClash(candidate) {
  const hits = db.events.filter(x => x.id !== candidate.id && ['Pending', 'Approved'].includes(x.status) && overlaps(candidate, x));
  return hits.length
    ? { ok: false, message: `Clash: "${hits[0].title}" already uses ${hits[0].venue} at ${fmtTime(hits[0].time)}.` }
    : { ok: true, message: 'No venue or time clash found.' };
}
function eventTag(e) {
  const soc = societyOf(e);
  if (interestCount(e) >= 200) return { cls: 'tag-imp', label: 'Popular' };
  if (soc && soc.category === 'Technical') return { cls: 'tag-new', label: 'Technical' };
  if (soc && soc.category === 'Sports') return { cls: 'tag-remind', label: 'Sports' };
  return { cls: 'tag-fest', label: 'Cultural' };
}

/* ----------------------------------------------------------------- state */
const state = {
  screen: 'splash', filter: 'All', showAll: false, societyDetail: null, societySearch: '',
  festDay: 1, eventId: null, approvalId: null,
  loginError: '', createError: '', countdownTimer: null, splashTimer: null
};

/* ---------------------------------------------------------------- screens */
function renderSplash() {
  return `<div class="splash">
    <div class="logo">C</div>
    <div class="name">CampusConnect</div>
    <div class="tag">Your campus. Your events.<br>One place.</div>
    <div class="load" id="loading-text">loading…</div>
  </div>`;
}

function renderLogin() {
  const err = state.loginError ? `<div class="form-error">${esc(state.loginError)}</div>` : '';
  const demos = [['student@college.edu', 'Student'], ['head@college.edu', 'Society head'], ['admin@college.edu', 'Admin']]
    .map(([email, label]) => `<button class="btn btn-ghost" style="margin-top:6px" data-action="demo-login" data-email="${email}">Sign in as ${label}</button>`).join('');
  return `<div class="section-pad" style="padding-top:52px">
    <div class="center" style="margin-bottom:22px">
      <div style="width:52px;height:52px;border-radius:16px;background:var(--navy);display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-size:26px;color:var(--amber);margin:0 auto 14px;">C</div>
      <div style="font-family:var(--disp);font-size:26px;color:var(--ink);">Welcome back</div>
      <div class="small muted">Log in with your college account</div>
    </div>
    ${err}
    <form data-form="login">
      <label class="field-label">College email</label>
      <input class="field" name="email" type="email" placeholder="yourname@college.edu" autocomplete="username">
      <label class="field-label">Password</label>
      <input class="field" name="password" type="password" placeholder="••••••••••" autocomplete="current-password">
      <button class="btn btn-primary" type="submit" style="margin-top:18px">Log in</button>
    </form>
    <div class="center small" style="margin-top:14px">Don't have an account? <a class="link" data-action="show-register">Register</a></div>
    <div class="section-title">Quick demo sign-in</div>
    ${demos}
    <div class="center small muted" style="margin-top:12px">All demo accounts use password <b>campus123</b></div>
  </div>`;
}

function ticketCard(e, user) {
  const tag = eventTag(e);
  const reg = user ? regFor(e.id, user.id) : null;
  return `<div class="ticket" data-action="open-event" data-id="${e.id}" tabindex="0" role="button">
    <div class="stub"><span class="d">${esc(dayNum(e.date))}</span><span class="m">${esc(monthShort(e.date))}</span></div>
    <div class="perf"></div>
    <div class="body">
      <h4>${esc(e.title)}</h4>
      <div class="meta">${esc(fmtTime(e.time))} · ${esc(e.venue)}</div>
      <div class="foot"><span class="interest-count">${interestCount(e)} interested</span><span class="tag ${tag.cls}">${tag.label}</span></div>
      ${reg && reg.status !== 'Cancelled' ? `<div class="small" style="margin-top:5px;color:var(--teal)">✓ ${esc(reg.status)}</div>` : ''}
    </div>
  </div>`;
}

function renderHome(user) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const categories = ['All'].concat(Array.from(new Set(db.societies.map(s => s.category))));
  const approved = db.events.filter(e => e.status === 'Approved')
    .filter(e => state.filter === 'All' || (societyOf(e) && societyOf(e).category === state.filter))
    .sort((a, b) => a.date.localeCompare(b.date));
  const shown = state.showAll ? approved : approved.slice(0, 3);
  const pills = categories.map(c => `<button class="pill ${state.filter === c ? 'on' : ''}" data-action="filter" data-filter="${esc(c)}">${esc(c)}</button>`).join('');
  return `<div class="app-header">
      <div class="eyebrow">${greet}</div><h2>${esc(user ? user.name : 'Student')} 👋</h2>
      <p>${approved.length} approved event${approved.length === 1 ? '' : 's'} in this view</p>
    </div>
    <div class="section-pad">
      <div class="pill-row">${pills}</div>
      <div class="section-title">Upcoming events <a data-action="see-all">${state.showAll ? 'Show less' : 'See all'}</a></div>
      ${shown.length ? shown.map(e => ticketCard(e, user)).join('') : '<div class="empty">No events in this category yet.</div>'}
      <div class="section-title">College fest</div>
      <div class="countdown-box">
        <div style="font-family:var(--disp);font-size:20px;letter-spacing:.5px;">🎪 COLLEGE FEST 2026</div>
        <div class="countdown-nums" data-countdown></div>
        <button class="btn btn-amber" style="margin-top:14px;width:auto;padding:9px 20px;" data-action="nav" data-id="fest">View schedule</button>
      </div>
    </div>`;
}

function renderEventDetails(user) {
  const e = db.events.find(x => x.id === state.eventId) || db.events.find(x => x.status === 'Approved');
  if (!e) return '<div class="empty">No events yet.</div>';
  const soc = societyOf(e);
  const reg = regFor(e.id, user ? user.id : -1);
  const fill = Math.min(100, Math.round(confirmedCount(e) / e.seatLimit * 100));
  const left = seatsLeft(e);
  const primary = reg && reg.status !== 'Cancelled'
    ? `<button class="btn btn-ghost" data-action="cancel-reg" data-id="${e.id}">✕ ${reg.status === 'Waitlisted' ? 'Leave waitlist' : 'Cancel registration'}</button>`
    : `<button class="btn btn-teal" data-action="register" data-id="${e.id}">❤️ ${left > 0 ? 'Interested & register' : 'Join waitlist'}</button>`;
  return `<div class="hero">
      <button class="back-btn" data-action="nav" data-id="home">‹</button>
      <div class="eyebrow">${esc(soc ? soc.name : 'Society')}</div>
      <h2>${esc(e.title)}</h2>
    </div>
    <div class="section-pad">
      <div class="card" style="display:flex;gap:16px;justify-content:space-between;">
        <div style="font-size:11px;color:var(--ink-soft);">📅<br><b style="color:var(--ink)">${esc(fmtDate(e.date))}</b></div>
        <div style="font-size:11px;color:var(--ink-soft);">⏰<br><b style="color:var(--ink)">${esc(fmtTime(e.time))}</b></div>
        <div style="font-size:11px;color:var(--ink-soft);">📍<br><b style="color:var(--ink)">${esc(e.venue)}</b></div>
      </div>
      <div class="section-title">About</div>
      <p style="font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin:0;">${esc(e.description)}</p>
      <div class="section-title">Response</div>
      <div class="card">
        <div class="interest-count" style="font-size:14px;">${interestCount(e)} students interested</div>
        <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${fill}%;"></div></div>
        <div class="small muted" style="margin-top:7px;">${confirmedCount(e)} / ${e.seatLimit} seats taken · ${left > 0 ? left + ' seats left' : 'waitlist only'} · ${waitCount(e)} waitlisted</div>
      </div>
      <div class="btn-row" style="margin-top:14px;">
        ${primary}
        <button class="btn btn-ghost" data-action="decline">Not interested</button>
      </div>
      <button class="btn btn-primary" style="margin-top:10px;" data-action="view-location" data-venue="${esc(e.venue)}">📍 View location</button>
    </div>`;
}

function societyRow(s, user) {
  const following = s.followerIds.includes(user ? user.id : -1);
  const count = db.events.filter(e => e.societyId === s.id && e.status === 'Approved').length;
  return `<div class="avatar-chip">
      <div class="ic" style="background:${s.color};color:#fff;">${esc(s.emoji)}</div>
      <div class="grow" data-action="open-society" data-id="${s.id}" tabindex="0" role="button">
        <div class="nm">${esc(s.name)}</div><div class="mt">${count} upcoming event${count === 1 ? '' : 's'} · ${esc(s.category)}</div>
      </div>
      <button class="follow-btn ${following ? 'on' : ''}" data-action="toggle-follow" data-id="${s.id}">${following ? 'Following' : 'Follow'}</button>
    </div>`;
}

function renderSocieties(user) {
  if (state.societyDetail) {
    const s = db.societies.find(x => x.id === state.societyDetail);
    if (s) {
      const evs = db.events.filter(e => e.societyId === s.id && e.status === 'Approved').sort((a, b) => a.date.localeCompare(b.date));
      const following = s.followerIds.includes(user ? user.id : -1);
      return `<div class="app-header">
          <button class="back-btn" data-action="back-societies">‹</button>
          <div class="eyebrow">${esc(s.category)} society</div><h2>${esc(s.emoji)} ${esc(s.name)}</h2>
          <p>${s.followerIds.length} followers · ${esc(s.description)}</p>
        </div>
        <div class="section-pad">
          <button class="btn ${following ? 'btn-ghost' : 'btn-primary'}" data-action="toggle-follow" data-id="${s.id}">${following ? '✓ Following — tap to unfollow' : '+ Follow this society'}</button>
          <div class="section-title">Upcoming events</div>
          ${evs.length ? evs.map(e => ticketCard(e, user)).join('') : '<div class="empty">No approved events yet.</div>'}
        </div>`;
    }
  }
  const list = db.societies.map(s => societyRow(s, user)).join('');
  return `<div class="app-header"><div class="eyebrow">Directory</div><h2>Societies</h2><p>Follow the ones you care about</p></div>
    <div class="section-pad">
      <div class="search-bar">🔍 <input id="society-search" type="search" placeholder="Search societies…" autocomplete="off"></div>
      <div id="society-list">${list}</div>
    </div>`;
}

function renderFest() {
  const days = Array.from(new Set(db.festSchedule.map(x => x.day))).sort((a, b) => a - b);
  const rows = db.festSchedule.filter(x => x.day === state.festDay);
  return `<div style="background:var(--navy);padding:20px 18px 26px;color:var(--paper);text-align:center;border-radius:0 0 26px 26px;position:relative;">
      <button class="back-btn" data-action="nav" data-id="home">‹</button>
      <div class="eyebrow">Live now</div>
      <div style="font-family:var(--disp);font-size:28px;">🎪 FEST 2026</div>
      <div class="countdown-nums" data-countdown></div>
    </div>
    <div class="section-pad">
      <div class="pill-row">${days.map(d => `<button class="pill ${state.festDay === d ? 'on' : ''}" data-action="fest-day" data-day="${d}">Day ${d}</button>`).join('')}</div>
      <div class="section-title">Day ${state.festDay} schedule</div>
      ${rows.map(r => `<div class="card" style="display:flex;gap:12px;align-items:center;">
          <div style="font-family:var(--mono);font-size:10.5px;color:var(--ink-faint);width:56px;">${esc(fmtTime(r.slotTime))}</div>
          <div style="flex:1;"><div style="font-weight:700;font-size:13px;color:var(--ink);">${esc(r.activity)}</div><div class="small muted">📍 ${esc(r.venue)}</div></div>
        </div>`).join('')}
      <button class="btn btn-ghost" style="margin-top:6px;" data-action="view-map">🗺️ View venue map</button>
    </div>`;
}

const NOTIF_STYLES = {
  NewEvent: ['tag-new', 'New event'], Reminder: ['tag-remind', 'Reminder'], Change: ['tag-imp', 'Important'],
  Result: ['tag-remind', 'Result'], Fest: ['tag-fest', 'Fest']
};
function renderNotifications(user) {
  const list = db.notifications.filter(n => n.userId === user.id || n.userId === null)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 40);
  const style = t => NOTIF_STYLES[t] || ['tag-remind', t];
  return `<div class="app-header">
      <div class="eyebrow">Stay updated</div><h2>Notifications</h2>
      <p>${list.filter(n => !n.readFlag).length} unread</p>
    </div>
    <div class="section-pad">
      <div class="btn-row" style="margin-bottom:10px;">
        <button class="btn btn-ghost" data-action="mark-all-read">Mark all read</button>
        <button class="btn btn-ghost" data-action="clear-notifications">Clear all</button>
      </div>
      ${list.length ? list.map(n => {
        const st = style(n.type);
        return `<div class="card" style="display:flex;gap:10px;align-items:flex-start;">
          ${n.readFlag ? '' : '<span class="unread-dot" style="margin-top:5px;"></span>'}
          <div style="flex:1;">
            <span class="tag ${st[0]}">${st[1]}</span>
            <div style="font-size:12.5px;margin-top:7px;color:var(--ink);line-height:1.4;">${esc(n.message)}</div>
            <div class="small muted" style="margin-top:5px;">${esc(timeAgo(n.sentAt))}</div>
          </div>
          ${n.readFlag ? '' : `<button class="follow-btn" data-action="mark-read" data-id="${n.id}">Read</button>`}
        </div>`;
      }).join('') : '<div class="empty">You are all caught up.</div>'}
    </div>`;
}

function renderMyEvents(user) {
  const soon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const regs = db.registrations.filter(r => r.userId === user.id && r.status !== 'Cancelled')
    .map(r => ({ reg: r, ev: db.events.find(e => e.id === r.eventId) }))
    .filter(x => x.ev).sort((a, b) => a.ev.date.localeCompare(b.ev.date));
  const groups = [
    ['This week', regs.filter(x => x.ev.date <= soon)],
    ['Next week', regs.filter(x => x.ev.date > soon && x.ev.date <= new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))],
    ['Later', regs.filter(x => x.ev.date > new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))]
  ];
  return `<div class="app-header"><div class="eyebrow">Your calendar</div><h2>My Events</h2><p>${regs.length} registered event${regs.length === 1 ? '' : 's'}</p></div>
    <div class="section-pad">
      ${groups.map(([label, items]) => `
        <div class="section-title">${label}</div>
        ${items.length ? items.map(({ reg, ev }) => `<div class="card" style="padding:10px 12px;">
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="font-family:var(--disp);font-size:22px;color:var(--navy);width:34px;text-align:center;">${esc(dayNum(ev.date))}</div>
            <div style="flex:1;min-width:0;">
              <div class="t1" style="font-size:12.5px;">${esc(ev.title)}</div>
              <div class="small muted">${esc(monthShort(ev.date))} · ${esc(fmtTime(ev.time))} · ${esc(ev.venue)}</div>
            </div>
            <span class="tag ${reg.status === 'Waitlisted' ? 'tag-wait' : 'tag-new'}">${esc(reg.status)}</span>
          </div>
          <button class="link" style="margin-top:6px;padding:0;" data-action="cancel-reg" data-id="${ev.id}">Cancel registration</button>
        </div>`).join('') : '<div class="small muted" style="padding:2px 2px 8px;">Nothing here.</div>'}
      `).join('')}
    </div>`;
}

function renderSocietyDashboard(user) {
  const soc = db.societies.find(s => s.headUserId === user.id) || db.societies.find(s => s.id === user.societyId);
  if (!soc) return `<div class="app-header"><div class="eyebrow">Society head</div><h2>Dashboard</h2></div>
    <div class="section-pad"><div class="empty">No society is assigned to your account yet.</div></div>`;
  const evs = db.events.filter(e => e.societyId === soc.id).sort((a, b) => a.date.localeCompare(b.date));
  const totalInterest = evs.reduce((n, e) => n + interestCount(e), 0);
  const approved = evs.filter(e => e.status === 'Approved');
  const avgFill = approved.length ? Math.round(approved.reduce((n, e) => n + confirmedCount(e) / e.seatLimit * 100, 0) / approved.length) : 0;
  return `<div class="app-header"><div class="eyebrow">${esc(soc.name)}</div><h2>Society Dashboard</h2><p>Manage your events and registrations</p></div>
    <div class="section-pad">
      <div class="stat-row">
        <div class="stat"><div class="n">${evs.length}</div><div class="l">Events</div></div>
        <div class="stat"><div class="n">${totalInterest}</div><div class="l">Interest</div></div>
        <div class="stat"><div class="n">${avgFill}%</div><div class="l">Avg. fill</div></div>
      </div>
      <div class="section-title">Your events</div>
      ${evs.map(e => {
        const statusCls = e.status === 'Approved' ? 'tag-new' : e.status === 'Pending' ? 'tag-pending' : 'tag-rejected';
        const fill = Math.min(100, Math.round(confirmedCount(e) / e.seatLimit * 100));
        const no = db.registrations.filter(r => r.eventId === e.id && r.status === 'Cancelled').length;
        return `<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div><h4>${esc(e.poster)} ${esc(e.title)}</h4><div class="small muted">${esc(fmtDate(e.date))} · ${esc(fmtTime(e.time))} · ${esc(e.venue)}</div></div>
            <span class="tag ${statusCls}">${esc(e.status)}</span>
          </div>
          ${e.status === 'Rejected' && e.rejectionReason ? `<div class="small" style="color:var(--coral);margin-top:8px;">Reason: ${esc(e.rejectionReason)}</div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px;">
            <span style="color:var(--teal);font-weight:700;">❤️ Interested: ${interestCount(e)}</span>
            <span class="muted">✕ Declined: ${no}</span>
          </div>
          <div class="small muted" style="font-family:var(--mono);margin:8px 0 4px;">EXPECTED ATTENDANCE — ${fill}% of venue capacity</div>
          <div class="progress-track"><div class="progress-fill" style="width:${fill}%;"></div></div>
          <div class="small muted" style="margin-top:6px;">${confirmedCount(e)} confirmed · ${waitCount(e)} waitlisted · ${seatsLeft(e)} seats left</div>
          <div class="btn-row" style="margin-top:10px;">
            <button class="btn btn-ghost" style="padding:8px 6px;font-size:11.5px;" data-action="view-registrations" data-id="${e.id}">Registrations</button>
            ${e.status === 'Approved' ? `<button class="btn btn-ghost" style="padding:8px 6px;font-size:11.5px;" data-action="send-reminder" data-id="${e.id}">Send reminder</button>` : ''}
          </div>
        </div>`;
      }).join('')}
      <button class="btn btn-primary" data-action="new-event">+ Create event</button>
    </div>`;
}

function renderCreateEvent(user) {
  const soc = db.societies.find(s => s.headUserId === user.id) || db.societies.find(s => s.id === user.societyId);
  const err = state.createError ? `<div class="form-error">${esc(state.createError)}</div>` : '';
  return `<div class="app-header"><div class="eyebrow">New · ${esc(soc ? soc.name : 'Society')}</div><h2>Create Event</h2></div>
    <div class="section-pad">
      ${err}
      <form data-form="create-event">
        <label class="field-label">Event name</label>
        <input class="field" name="title" placeholder="e.g. Street Photography Walk" required>
        <label class="field-label">Description</label>
        <textarea class="field" name="description" rows="3" placeholder="What's this event about?" required></textarea>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;"><label class="field-label">Date</label><input class="field" name="date" type="date" value="${todayStr()}" required></div>
          <div style="flex:1;"><label class="field-label">Time</label><input class="field" name="time" type="time" value="14:00" required></div>
        </div>
        <label class="field-label">Venue</label>
        <input class="field" name="venue" placeholder="Seminar Hall 2" required>
        <label class="field-label">Seat limit</label>
        <input class="field" name="seatLimit" type="number" min="1" value="100" required>
        <label class="field-label">Poster</label>
        <select class="field" name="poster">
          <option value="🎤">🎤 Talk / debate</option><option value="💻">💻 Tech</option>
          <option value="🎭">🎭 Drama</option><option value="📷">📷 Photography</option>
          <option value="🎨">🎨 Design</option><option value="🎵">🎵 Music</option>
        </select>
        <button class="btn btn-coral" type="submit" style="margin-top:16px;">Submit for approval</button>
        <div class="center small muted" style="margin-top:10px;">Status will be <span class="tag tag-pending">Pending Approval</span> until the admin approves it.</div>
      </form>
    </div>`;
}

function renderAdminDashboard() {
  const pending = db.events.filter(e => e.status === 'Pending');
  const upcoming = db.events.filter(e => e.status === 'Approved' && e.date >= todayStr());
  return `<div class="app-header"><div class="eyebrow">College admin</div><h2>Admin Dashboard</h2><p>Approve events, manage societies, view reports</p></div>
    <div class="section-pad">
      <div class="stat-row">
        <div class="stat"><div class="n">${pending.length}</div><div class="l">Pending</div></div>
        <div class="stat"><div class="n">${db.societies.length}</div><div class="l">Societies</div></div>
        <div class="stat"><div class="n">${upcoming.length}</div><div class="l">Upcoming</div></div>
      </div>
      <div class="section-title">Pending approval <a data-action="view-reports">Reports</a></div>
      ${pending.length ? pending.map(e => `<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div style="min-width:0;">
              <h4>${esc(e.poster)} ${esc(e.title)}</h4>
              <div class="small muted">${esc(societyOf(e) ? societyOf(e).name : '')} · ${esc(fmtDate(e.date))} · ${esc(e.venue)}</div>
              <div class="small" style="color:${checkClash(e).ok ? 'var(--teal)' : 'var(--coral)'};margin-top:5px;">${esc(checkClash(e).message)}</div>
            </div>
            <span class="tag tag-pending">Pending</span>
          </div>
          <div class="btn-row" style="margin-top:10px;">
            <button class="btn btn-teal" style="padding:8px;" data-action="open-approval" data-id="${e.id}">Review</button>
            <button class="btn btn-ghost" style="padding:8px;" data-action="reject-event" data-id="${e.id}">Reject</button>
          </div>
        </div>`).join('') : '<div class="empty">No events are waiting for approval.</div>'}
      <button class="btn btn-primary" data-action="manage-societies">+ Add / manage society</button>
      <div class="spacer"></div>
      <button class="btn btn-ghost" data-action="view-reports">📊 View participation report</button>
    </div>`;
}

function renderApproval() {
  const e = db.events.find(x => x.id === state.approvalId) || db.events.find(x => x.status === 'Pending');
  if (!e) return '<div class="empty">Nothing to review.</div>';
  const soc = societyOf(e);
  const clash = checkClash(e);
  const rows = [
    ['Event', e.title], ['Society', soc ? soc.name : '—'], ['Date', fmtDate(e.date)],
    ['Time', fmtTime(e.time)], ['Venue', e.venue], ['Seat limit', e.seatLimit],
    ['Expected interest', interestCount(e)], ['Submitted by', (db.users.find(u => u.id === e.createdBy) || {}).name || '—']
  ];
  return `<div class="app-header"><button class="back-btn" data-action="nav" data-id="admindashboard">‹</button>
      <div class="eyebrow">Review · status ${esc(e.status)}</div><h2>Event Approval</h2></div>
    <div class="section-pad">
      <div class="card">
        ${rows.map(([k, v]) => `<div class="table-row"><span class="t2">${esc(k)}</span><span class="t1" style="text-align:right;">${esc(v)}</span></div>`).join('')}
        <div class="table-row"><span class="t2">Clash check</span><span class="small" style="text-align:right;color:${clash.ok ? 'var(--teal)' : 'var(--coral)'};font-weight:700;">${esc(clash.message)}</span></div>
      </div>
      <div class="small muted" style="line-height:1.6;margin-bottom:12px;">${esc(e.description)}</div>
      <button class="btn btn-teal" data-action="approve-event" data-id="${e.id}" ${clash.ok ? '' : 'disabled'}>✓ Approve &amp; Notify Students</button>
      <div class="spacer"></div>
      <button class="btn btn-ghost" data-action="request-changes" data-id="${e.id}">Request changes</button>
      <div class="spacer"></div>
      <button class="btn" style="background:rgba(255,107,74,.12);color:var(--coral);" data-action="reject-event" data-id="${e.id}">✕ Reject with reason</button>
    </div>`;
}

/* -------------------------------------------------------------- registry */
const SCREENS = [
  { id: 'splash',       role: 'student', label: 'Splash Screen',     common: true, caption: 'Opening screen shown briefly on launch, then routes to Login or the role home screen.', render: renderSplash },
  { id: 'login',        role: 'student', label: 'Login',             common: true, caption: 'College email + password. Registration, validation and role-based routing all work.', render: renderLogin },
  { id: 'home',         role: 'student', label: 'Home Dashboard',    nav: 'student', caption: 'Approved events as ticket cards with live category filters and a fest countdown.', render: renderHome },
  { id: 'eventdetails', role: 'student', label: 'Event Details',     common: true, nav: 'student', caption: 'Full event info, seat availability and Interested / Register actions. Registration writes to D4.', render: renderEventDetails },
  { id: 'societies',    role: 'student', label: 'Societies',         common: true, nav: 'student', caption: 'Searchable society directory with working follow / unfollow and society profiles.', render: renderSocieties },
  { id: 'fest',         role: 'student', label: 'Fest Dashboard',    common: true, nav: 'student', caption: 'Day-wise fest schedule with a live countdown and venue map.', render: renderFest },
  { id: 'notifications',role: 'student', label: 'Notifications',     nav: 'all', caption: 'Categorised alert feed. Approvals, reminders and follow activity add real notifications.', render: renderNotifications },
  { id: 'myevents',     role: 'student', label: 'My Events',         nav: 'student', caption: 'Personal calendar built from the student’s registrations, with cancel and waitlist states.', render: renderMyEvents },
  { id: 'headdashboard',role: 'head',    label: 'Society Dashboard', nav: 'head', caption: 'Live interest, registrations and venue fill for the society head’s own events.', render: renderSocietyDashboard },
  { id: 'createevent',  role: 'head',    label: 'Create Event',      nav: 'head', caption: 'Validated event form with past-date and venue/time-clash checks; submits as Pending.', render: renderCreateEvent },
  { id: 'admindashboard',role: 'admin',  label: 'Admin Dashboard',   nav: 'admin', caption: 'Pending approvals, society management and a participation report.', render: renderAdminDashboard },
  { id: 'approval',     role: 'admin',   label: 'Event Approval',    nav: 'admin', caption: 'Approve and notify followers through simulated FCM, or reject with a stored reason.', render: renderApproval }
];

/* ------------------------------------------------------------ navigation */
function bottomNav(kind, active) {
  const sets = {
    student: [['home', '🏠', 'Home'], ['societies', '🏛️', 'Societies'], ['notifications', '🔔', 'Alerts'], ['myevents', '📅', 'Mine']],
    head:    [['headdashboard', '📊', 'Dashboard'], ['createevent', '➕', 'Create'], ['notifications', '🔔', 'Alerts']],
    admin:   [['admindashboard', '📊', 'Dashboard'], ['approval', '✅', 'Approvals'], ['notifications', '🔔', 'Alerts']]
  };
  const items = kind === 'all'
    ? sets[roleOf(currentUser())] || sets.student
    : sets[kind] || [];
  return items.map(([id, ic, label]) => `<button class="bn ${id === active ? 'active' : ''}" data-action="nav" data-id="${id}"><span class="ic">${ic}</span>${label}</button>`).join('');
}
function switchDemo(role, quiet) {
  const email = { student: 'student@college.edu', head: 'head@college.edu', admin: 'admin@college.edu' }[role];
  const u = db.users.find(x => x.email === email);
  if (u) { setSession(u.id); if (!quiet) toast(`Switched to ${u.name} (${u.role})`); }
}
function go(id) {
  const s = SCREENS.find(x => x.id === id);
  if (!s) return;
  closeModal();
  const user = currentUser();
  if (!s.common && s.id !== 'login' && s.id !== 'splash') {
    if (!user) { state.loginError = ''; state.screen = 'login'; render(); return; }
    if (roleOf(user) !== s.role) switchDemo(s.role, true);
  }
  state.screen = id;
  if (id !== 'login') state.loginError = '';
  render();
  if (id === 'splash') scheduleSplash();
  $('#view').scrollTop = 0;
}
function scheduleSplash() {
  clearTimeout(state.splashTimer);
  state.splashTimer = setTimeout(() => {
    const u = currentUser();
    go(u ? homeForRole(roleOf(u)) : 'login');
  }, 1400);
}
function render() {
  const s = SCREENS.find(x => x.id === state.screen) || SCREENS[0];
  const user = currentUser();
  $('#view').innerHTML = s.render ? s.render(user) : '';
  $('#bottomnav').innerHTML = s.nav ? bottomNav(s.nav, s.id) : '';
  $('#caption').innerHTML = `<b>${esc(s.label)}</b><br>${s.caption}`;
  $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.id === s.id));
  if (s.id === 'societies' && !state.societyDetail && state.societySearch) {
    const input = $('#society-search');
    if (input) input.value = state.societySearch;
    $$('#society-list .avatar-chip').forEach(row => {
      row.classList.toggle('hidden', !row.textContent.toLowerCase().includes(state.societySearch.toLowerCase()));
    });
  }
  startCountdown();
}
function buildSidebar() {
  const groups = { student: 'nav-student', head: 'nav-head', admin: 'nav-admin' };
  Object.keys(groups).forEach(role => {
    const col = $('#' + groups[role]);
    col.innerHTML = '';
    SCREENS.map((s, i) => ({ s, i })).filter(x => x.s.role === role).forEach(({ s, i }) => {
      const b = document.createElement('button');
      b.className = 'chip'; b.dataset.id = s.id; b.dataset.action = 'nav';
      b.innerHTML = `<span>${esc(s.label)}</span><span class="num">${String(i + 1).padStart(2, '0')}</span>`;
      col.appendChild(b);
    });
  });
}
function startCountdown() {
  clearInterval(state.countdownTimer);
  const nodes = $$('[data-countdown]');
  if (!nodes.length) return;
  const tick = () => {
    let diff = Math.floor((new Date(FEST_START).getTime() - Date.now()) / 1000);
    let html;
    if (diff <= 0) html = '<div style="font-family:var(--disp);font-size:22px;color:var(--amber);">LIVE NOW 🎪</div>';
    else html = `<div class="u"><b>${String(Math.floor(diff / 86400)).padStart(2, '0')}</b><span>DAYS</span></div>
                 <div class="u"><b>${String(Math.floor(diff % 86400 / 3600)).padStart(2, '0')}</b><span>HRS</span></div>
                 <div class="u"><b>${String(Math.floor(diff % 3600 / 60)).padStart(2, '0')}</b><span>MIN</span></div>`;
    nodes.forEach(n => { n.innerHTML = html; });
  };
  tick();
  state.countdownTimer = setInterval(tick, 1000);
}

/* ------------------------------------------------------------ modal/toast */
function openModal(html, title) {
  $('#modal-root').innerHTML = `<div class="modal-overlay">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>
      ${html}
    </div></div>`;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function toast(message, kind) {
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.textContent = message;
  $('#toast-root').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function showFormError(form, message) {
  let box = form.querySelector('.form-error');
  if (!box) { box = document.createElement('div'); box.className = 'form-error'; form.prepend(box); }
  box.textContent = message;
}

/* ------------------------------------------------------------- operations */
function registerUser(name, email, password) {
  name = String(name || '').trim(); email = String(email || '').trim(); password = String(password || '');
  if (!name || name.length > 50) return { ok: false, error: !name ? 'Name is required.' : 'Name must be at most 50 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 6 || password.length > 20) return { ok: false, error: password.length < 6 ? 'Password must be at least 6 characters.' : 'Password must be at most 20 characters.' };
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: 'An account with this email already exists.' };
  const u = { id: nextId(db.users), name, email, collegeId: 'NEW' + nextId(db.users), role: 'Student', societyId: null, salt: DEMO_SALT, passwordHash: demoHash(password, DEMO_SALT) };
  db.users.push(u); saveDB();
  return { ok: true, user: u };
}
function loginUser(email, password) {
  email = String(email || '').trim(); password = String(password || '');
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!password) return { ok: false, error: 'Password is required.' };
  const u = db.users.find(x => x.email.toLowerCase() === email.toLowerCase());
  if (!u || u.passwordHash !== demoHash(password, u.salt)) return { ok: false, error: 'Invalid email or password.' };
  setSession(u.id);
  return { ok: true, user: u };
}
function registerInterest(eid, user) {
  const e = db.events.find(x => x.id === eid);
  if (!e || e.status !== 'Approved') { toast('This event is not open for registration.', 'warn'); return; }
  if (regFor(eid, user.id)) { toast('You are already registered.', 'warn'); return; }
  const status = seatsLeft(e) > 0 ? 'Confirmed' : 'Waitlisted';
  db.registrations.push({ id: nextId(db.registrations), eventId: eid, userId: user.id, status, registeredAt: new Date().toISOString() });
  addNotification(user.id, eid, 'Result', status === 'Confirmed'
    ? `You're registered for ${e.title}. See you there!`
    : `You're on the waitlist for ${e.title}. We'll notify you if a seat opens.`);
  saveDB();
  toast(status === 'Confirmed' ? 'Registered! Added to My Events.' : 'You joined the waitlist.', 'ok');
}
function cancelRegistration(eid, user) {
  const r = regFor(eid, user.id);
  if (!r || r.status === 'Cancelled') return;
  const wasConfirmed = r.status === 'Confirmed';
  r.status = 'Cancelled';
  if (wasConfirmed) {
    const e = db.events.find(x => x.id === eid);
    const waiting = db.registrations.filter(x => x.eventId === eid && x.status === 'Waitlisted')
      .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))[0];
    if (waiting) {
      waiting.status = 'Confirmed';
      if (db.users.some(u => u.id === waiting.userId)) addNotification(waiting.userId, eid, 'Result', `A seat opened up — you're now confirmed for ${e.title}.`);
    }
  }
  saveDB(); toast('Registration cancelled.', 'warn');
}
function approveEvent(eid) {
  const e = db.events.find(x => x.id === eid);
  if (!e || e.status !== 'Pending') { toast('This event is no longer pending.', 'warn'); return; }
  if (!checkClash(e).ok) { toast('Resolve the venue clash before approving.', 'warn'); return; }
  e.status = 'Approved';
  const soc = societyOf(e);
  const audience = db.users.filter(u => u.role === 'Student' && soc && soc.followerIds.includes(u.id));
  audience.forEach(u => addNotification(u.id, e.id, 'NewEvent', `New event: ${e.title} at ${e.venue} on ${fmtDate(e.date)}.`));
  if (db.users.some(u => u.id === e.createdBy)) addNotification(e.createdBy, e.id, 'Result', `Your event "${e.title}" was approved and students were notified.`);
  saveDB();
  toast(`Approved · ${audience.length} push notification${audience.length === 1 ? '' : 's'} queued via FCM.`, 'ok');
}
function rejectEvent(eid, reason) {
  const e = db.events.find(x => x.id === eid);
  if (!e) return;
  e.status = 'Rejected'; e.rejectionReason = reason.trim() || 'No reason provided.';
  if (db.users.some(u => u.id === e.createdBy)) addNotification(e.createdBy, e.id, 'Result', `Your event "${e.title}" was rejected. Reason: ${e.rejectionReason}`);
  saveDB(); closeModal(); toast('Event rejected; society head notified.', 'warn');
}
function createEvent(data, user) {
  const title = String(data.title || '').trim();
  const venue = String(data.venue || '').trim();
  const desc = String(data.description || '').trim();
  const seats = Number(data.seatLimit);
  if (!title || !venue || !desc) return { ok: false, error: 'Title, description and venue are required.' };
  if (!data.date || !data.time) return { ok: false, error: 'Date and time are required.' };
  if (data.date < todayStr()) return { ok: false, error: 'The event date cannot be in the past.' };
  if (!Number.isInteger(seats) || seats < 1) return { ok: false, error: 'Seat limit must be at least 1.' };
  const soc = db.societies.find(s => s.headUserId === user.id) || db.societies.find(s => s.id === user.societyId);
  if (!soc) return { ok: false, error: 'No society is assigned to your account.' };
  const candidate = { id: 0, societyId: soc.id, venue, date: data.date, time: data.time };
  const clash = checkClash(candidate);
  if (!clash.ok) return { ok: false, error: clash.message };
  const e = {
    id: nextId(db.events), societyId: soc.id, title, description: desc, venue,
    date: data.date, time: data.time, seatLimit: seats, status: 'Pending', rejectionReason: '',
    poster: data.poster || '🎤', baseInterested: 0, baseRegistered: 0,
    createdBy: user.id, createdAt: new Date().toISOString()
  };
  db.events.push(e);
  db.users.filter(u => u.role === 'Admin').forEach(u => addNotification(u.id, e.id, 'Result', `New event pending approval: ${title}`));
  saveDB();
  return { ok: true, event: e };
}
function sendReminder(eid) {
  const e = db.events.find(x => x.id === eid);
  if (!e) return;
  const regs = db.registrations.filter(r => r.eventId === eid && r.status !== 'Cancelled');
  regs.forEach(r => { if (db.users.some(u => u.id === r.userId)) addNotification(r.userId, eid, 'Reminder', `Reminder: ${e.title} is on ${fmtDate(e.date)} at ${fmtTime(e.time)}, ${e.venue}.`); });
  saveDB(); toast(`Reminder sent to ${regs.length} registered student${regs.length === 1 ? '' : 's'}.`, 'ok');
}
function manageSocieties(data, admin) {
  const name = String(data.name || '').trim();
  if (!name) return { ok: false, error: 'Society name is required.' };
  let head = null;
  const email = String(data.headEmail || '').trim();
  if (email) {
    head = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!head || head.role !== 'SocietyHead') return { ok: false, error: 'No society head found with that email.' };
  }
  const s = { id: nextId(db.societies), name, category: String(data.category || 'Cultural'), emoji: String(data.emoji || '🎪'), color: 'var(--navy-3)', description: String(data.description || ''), headUserId: head ? head.id : null, followerIds: [] };
  db.societies.push(s);
  if (head) head.societyId = s.id;
  addNotification(admin.id, null, 'Result', `Society "${name}" was added${head ? ` with ${head.name} as head` : ''}.`);
  saveDB();
  return { ok: true, society: s };
}

/* ---------------------------------------------------------------- modals */
function registerForm() {
  return `<form data-form="register">
    <label class="field-label">Full name</label><input class="field" name="name" placeholder="Your name" required>
    <label class="field-label">College email</label><input class="field" name="email" type="email" placeholder="you@college.edu" required>
    <label class="field-label">Password (6–20 characters)</label><input class="field" name="password" type="password" required>
    <button class="btn btn-primary" type="submit" style="margin-top:16px;">Create account</button>
  </form>`;
}
function rejectForm(eid) {
  return `<form data-form="reject">
    <input type="hidden" name="eventId" value="${eid}">
    <label class="field-label">Reason for rejection</label>
    <textarea class="field" name="reason" rows="3" placeholder="e.g. Venue clashes with exams" required></textarea>
    <button class="btn btn-coral" type="submit" style="margin-top:14px;">Reject with reason</button>
  </form>`;
}
function societyForm() {
  return `<form data-form="society">
    <label class="field-label">Society name</label><input class="field" name="name" placeholder="e.g. Robotics Society" required>
    <label class="field-label">Category</label>
    <select class="field" name="category"><option>Technical</option><option>Cultural</option><option>Sports</option></select>
    <label class="field-label">Emoji</label><input class="field" name="emoji" value="🤖" maxlength="4">
    <label class="field-label">Description</label><textarea class="field" name="description" rows="2"></textarea>
    <label class="field-label">Society head email (optional)</label><input class="field" name="headEmail" placeholder="head@college.edu">
    <button class="btn btn-primary" type="submit" style="margin-top:14px;">Add society</button>
    <div class="small muted center" style="margin-top:8px;">Second head account: head2@college.edu</div>
  </form>`;
}
function registrationsModal(eid) {
  const e = db.events.find(x => x.id === eid);
  const regs = db.registrations.filter(r => r.eventId === eid && r.status !== 'Cancelled');
  const rows = regs.length ? regs.map(r => {
    const u = db.users.find(x => x.id === r.userId);
    return `<div class="table-row"><span class="t1">${esc(u ? u.name : 'Student #' + r.userId)}</span>
      <span class="t2">${esc(fmtDate(r.registeredAt.slice(0, 10)))}</span>
      <span class="tag ${r.status === 'Waitlisted' ? 'tag-wait' : 'tag-new'}">${esc(r.status)}</span></div>`;
  }).join('') : '<div class="empty">No registrations yet.</div>';
  return `<div class="small muted" style="margin-bottom:8px;">${esc(e ? e.title : '')} · ${confirmedCount(e || { baseRegistered: 0, id: -1, seatLimit: 1 })} / ${e ? e.seatLimit : 0} seats</div>${rows}`;
}
function reportsModal() {
  const evs = db.events.filter(e => e.status === 'Approved' || e.status === 'Rejected');
  return `<div class="small muted" style="margin-bottom:10px;">Participation across all submitted events (D3 + D4).</div>
    ${evs.map(e => `<div class="table-row">
      <span class="t1" style="flex:2;">${esc(e.title)}</span>
      <span class="t2" style="flex:1;text-align:right;">${confirmedCount(e)}/${e.seatLimit}</span>
      <span class="tag ${e.status === 'Approved' ? 'tag-new' : 'tag-rejected'}">${Math.round(confirmedCount(e) / e.seatLimit * 100)}%</span>
    </div>`).join('') || '<div class="empty">No reports yet.</div>'}`;
}
function locationModal(venue) {
  return `<div class="card"><div style="font-family:var(--mono);font-size:11px;color:var(--ink-faint);line-height:2;">
      ┌───────────────────────────┐<br>
      │  N  &nbsp; MAIN ROAD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; │<br>
      │  ┌──────┐ &nbsp; ┌──────┐ &nbsp;│<br>
      │  │ LAB  │ &nbsp; │${esc(String(venue).slice(0, 8)).padEnd(8, ' ')}│ &nbsp;│<br>
      │  └──────┘ &nbsp; └──────┘ &nbsp;│<br>
      │  &nbsp;&nbsp; CAMPUS GROUND &nbsp;&nbsp;&nbsp; │<br>
      └───────────────────────────┘
    </div></div>
    <div class="center small muted">Venue: <b>${esc(venue)}</b> · map is illustrative in this prototype.</div>`;
}

/* --------------------------------------------------------------- handlers */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) { closeModal(); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = Number(el.dataset.id);
  const user = currentUser();
  switch (action) {
    case 'nav': go(el.dataset.id); break;
    case 'demo-login': {
      const u = db.users.find(x => x.email === el.dataset.email);
      if (u) { setSession(u.id); toast(`Signed in as ${u.name}`); go(homeForRole(roleOf(u))); }
      break;
    }
    case 'reset-data': openModal(`<p class="small muted">This clears all local changes and restores the seeded demo accounts, events and registrations.</p><button class="btn btn-coral" data-action="confirm-reset">Reset everything</button>`, 'Reset demo data'); break;
    case 'confirm-reset': db = seedDB(); saveDB(); setSession(null); closeModal(); go('splash'); toast('Demo data restored.', 'ok'); break;
    case 'show-register': openModal(registerForm(), 'Create account'); break;
    case 'close-modal': closeModal(); break;
    case 'open-event': state.eventId = id; go('eventdetails'); break;
    case 'register': if (user) { registerInterest(id, user); render(); } break;
    case 'cancel-reg': if (user) { cancelRegistration(id, user); render(); } break;
    case 'decline': toast("Noted — we'll keep your feed focused.", 'ok'); break;
    case 'open-society': state.societyDetail = id; render(); break;
    case 'back-societies': state.societyDetail = null; render(); break;
    case 'toggle-follow': {
      if (!user) break;
      const s = db.societies.find(x => x.id === id);
      if (!s) break;
      const i = s.followerIds.indexOf(user.id);
      if (i >= 0) { s.followerIds.splice(i, 1); toast(`Unfollowed ${s.name}.`); }
      else { s.followerIds.push(user.id); toast(`Following ${s.name}. You'll get its event alerts.`, 'ok'); }
      saveDB(); render(); break;
    }
    case 'fest-day': state.festDay = Number(el.dataset.day); render(); break;
    case 'filter': state.filter = el.dataset.filter; render(); break;
    case 'see-all': state.showAll = !state.showAll; render(); break;
    case 'mark-read': {
      const n = db.notifications.find(x => x.id === id); if (n) { n.readFlag = true; saveDB(); render(); }
      break;
    }
    case 'mark-all-read':
      db.notifications.filter(n => n.userId === (user && user.id)).forEach(n => { n.readFlag = true; });
      saveDB(); render(); toast('All notifications marked as read.', 'ok'); break;
    case 'clear-notifications':
      db.notifications = db.notifications.filter(n => n.userId !== (user && user.id));
      saveDB(); render(); toast('Notification feed cleared.', 'ok'); break;
    case 'open-approval': state.approvalId = id; go('approval'); break;
    case 'approve-event': approveEvent(id); render(); break;
    case 'reject-event': openModal(rejectForm(id), 'Reject event'); break;
    case 'request-changes':
      if (db.users.some(u => u.id === (db.events.find(x => x.id === id) || {}).createdBy)) addNotification((db.events.find(x => x.id === id) || {}).createdBy, id, 'Result', 'The admin requested changes to your event before approval.');
      saveDB(); toast('Change request sent to the society head.', 'ok'); break;
    case 'new-event': state.createError = ''; go('createevent'); break;
    case 'view-registrations': openModal(registrationsModal(id), 'Registrations'); break;
    case 'send-reminder': sendReminder(id); render(); break;
    case 'manage-societies': openModal(societyForm(), 'Add society'); break;
    case 'view-reports': openModal(reportsModal(), 'Participation report'); break;
    case 'view-location': openModal(locationModal(el.dataset.venue), 'Venue location'); break;
    case 'view-map': openModal(`<div class="card small" style="font-family:var(--mono);line-height:2;">
        MAIN GROUND → BATTLE OF BANDS &amp; FASHION SHOW<br>
        AUDITORIUM → CEREMONIES, DANCE &amp; DRAMA<br>
        COMPUTER LAB 3 → HACKATHON<br>
        SEMINAR HALLS → TALKS &amp; DEBATES<br>
        EXHIBITION HALL → PHOTO &amp; DESIGN EXPO
      </div>`, 'Venue map'); break;
    case 'logout': setSession(null); closeModal(); go('login'); toast('Signed out.'); break;
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'society-search') {
    const q = e.target.value.trim().toLowerCase();
    state.societySearch = q;
    $$('#society-list .avatar-chip').forEach(row => {
      row.classList.toggle('hidden', !row.textContent.toLowerCase().includes(q));
    });
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const fd = new FormData(form);
  const user = currentUser();
  switch (form.dataset.form) {
    case 'login': {
      const r = loginUser(fd.get('email'), fd.get('password'));
      if (!r.ok) { state.loginError = r.error; render(); }
      else { state.loginError = ''; toast(`Welcome, ${r.user.name}!`, 'ok'); go(homeForRole(roleOf(r.user))); }
      break;
    }
    case 'register': {
      const r = registerUser(fd.get('name'), fd.get('email'), fd.get('password'));
      if (!r.ok) { showFormError(form, r.error); break; }
      closeModal(); setSession(r.user.id); toast('Account created. Welcome to CampusConnect!', 'ok'); go('home');
      break;
    }
    case 'create-event': {
      if (!user) break;
      const r = createEvent(Object.fromEntries(fd.entries()), user);
      if (!r.ok) { state.createError = r.error; render(); }
      else { state.createError = ''; go('headdashboard'); toast('Event submitted for admin approval.', 'ok'); }
      break;
    }
    case 'reject': {
      rejectEvent(Number(fd.get('eventId')), String(fd.get('reason') || ''));
      go('admindashboard'); break;
    }
    case 'society': {
      if (!user) break;
      const r = manageSocieties(Object.fromEntries(fd.entries()), user);
      if (!r.ok) { showFormError(form, r.error); break; }
      closeModal(); render(); toast(`Society "${r.society.name}" added.`, 'ok');
      break;
    }
  }
});

document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-action][tabindex]')) {
    e.preventDefault(); e.target.click();
  }
});

/* ------------------------------------------------------------------ init */
function updateClock() {
  $('#clock').textContent = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
}
buildSidebar();
render();
scheduleSplash();
updateClock();
setInterval(updateClock, 30000);
