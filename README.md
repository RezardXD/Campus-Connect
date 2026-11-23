# CampusConnect — Working Prototype

A self-contained, clickable version of all 12 screens from the assignment prototype. It runs entirely in the browser with a mock backend stored in `localStorage` — no build step, no server, no API keys.

## Run it

Open `index.html` in Chrome, Edge or Firefox. That's it.

If your browser restricts local storage for `file://` pages, serve the folder instead:

```bash
cd campusconnect-app
python -m http.server 8000
# open http://localhost:8000
```

## Demo accounts

All accounts use password **`campus123`**.

| Role | Email | What you can do |
|---|---|---|
| Student | `student@college.edu` | Browse/register for events, follow societies, view alerts and My Events |
| Society head (Debate) | `head@college.edu` | Create events, view registrations, send reminders |
| Society head (Coding) | `head2@college.edu` | Same, for a second society |
| Admin | `admin@college.edu` | Approve/reject events, manage societies, view participation reports |

The sidebar has one-click **Demo accounts** buttons and a **Reset demo data** button. Selecting a screen from the other role groups automatically switches to that role's demo account.

## What actually works

- **Login / registration** — validation rules from the report (name 1–50, email format, password 6–20), duplicate-email check, role-based routing, demo reset.
- **Event feed** — approved events only, live category filter, "See all", ticket cards, dynamic fest countdown.
- **Event details & registration** — seat limits, Confirmed/Waitlisted states, cancel registration with automatic waitlist promotion, notifications, venue modal.
- **Societies** — search, follow/unfollow, society profile with its events. Followers form the notification audience on approval.
- **Fest dashboard** — day-wise schedule and venue map.
- **Notifications** — categorised feed, unread marks, mark-all-read, clear. New events, reminders, approvals and rejections add real entries.
- **Society head** — stats, event statuses, registration list, reminders, validated create-event form with past-date and venue/time-clash checks; submissions go to `Pending`.
- **Admin** — pending queue, clash-check result, approve (queues simulated FCM push notifications to followers), reject with stored reason, request changes, add society/head, participation report.

All changes persist in `localStorage` under `campusconnect_db_v1` and `campusconnect_session_v1`.

## Mapping to the assignment

| Store in report | Implementation |
|---|---|
| D1 Users | `db.users` — role, college id, salted demo hash |
| D2 Societies | `db.societies` — includes `followerIds` for notification audience |
| D3 Events | `db.events` — statuses Pending / Approved / Rejected / Cancelled, rejection reason, seat limit |
| D4 Registrations | `db.registrations` — Confirmed / Waitlisted / Cancelled with timestamp |
| D5 Notifications | `db.notifications` — NewEvent / Reminder / Change / Result / Fest, with read flag |
| FestSchedule (DFD HTML, D6) | `db.festSchedule` — powers screen 6 without changing the report's D1–D5 estimate |

`baseInterested` and `baseRegistered` on seeded events represent pre-existing campus interest/counts so the dashboard numbers look realistic; live registrations are added on top.

## Notes

- The password hash in this prototype is a small synchronous demo hash so it works offline. The report's production design — Firebase Authentication with salted PBKDF2-SHA256 — is unchanged; only this demo uses a stand-in.
- FCM is simulated by writing notification records and showing a "push notification queued" toast; no network calls are made.
- This build follows the PDF report as the source of truth for requirements (registration with seats/waitlist, approval reasons). The alternate "Interested / Not Interested" wording in the prototype HTML is preserved as the button copy, but the action underneath registers the student.
