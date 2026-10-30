# Skin Care Hub — interview notes

What this project is, what it's built with, and why — written so you can answer questions about it confidently.

## One-line pitch

A booking marketplace (like a small "Booking.com for skin clinics") for Peshawar: patients find verified skin-care clinics, compare treatments and prices, and book appointments; clinic owners manage their bookings, services and public profile; a Hub admin verifies and manages clinics.

## Tech stack (the MERN stack)

| Layer | Technology | Why I chose it |
|---|---|---|
| Database | **MongoDB** (Atlas cloud) | Flexible document model fits clinics (each has its own services list, hours, amenities); Atlas gives a free managed cloud database with replication. |
| API | **Express.js** on **Node.js** | Minimal, widely used REST framework; same language (JavaScript) on both ends of the app. |
| Frontend | **React 18** with **Vite** | Component-based UI, fast dev server and hot reload from Vite; React Router v6 for client-side routing (SPA — no page reloads). |
| ODM | **Mongoose** | Schemas, validation and queries for MongoDB from Node. |

Supporting libraries: **jsonwebtoken** (auth tokens), **bcryptjs** (password hashing), **cors**, **dotenv** (configuration via `.env`).

## Architecture

```
React SPA (client, port 5173)  --/api proxy-->  Express REST API (server, port 5001)  -->  MongoDB Atlas
```

- The React app never talks to the database directly — it calls the REST API with `fetch`.
- In development, Vite proxies `/api/*` to the Express server so there are no CORS issues.
- The API is stateless: every request carries a JWT; any server instance can answer it.

## Authentication & authorization

- **Signup/login** with email + password. Passwords are never stored — only a **bcrypt hash** (salted, 10 rounds).
- On login the server signs a **JWT** (JSON Web Token, 7-day expiry) containing the user id and role. The client stores it and sends it as `Authorization: Bearer <token>` on every request.
- **Three roles**: `patient`, `clinic`, `admin`. Middleware (`requireAuth`, `requireRole`) guards every protected route on the server; the React router mirrors the same rules in the UI (e.g. a clinic account opening a patient page is redirected to its dashboard). Key point for interviews: **the UI checks are convenience, the server checks are the real security** — every rule is enforced in the API even if someone bypasses the frontend.
- Clinic accounts are **isolated**: a clinic can only see its own public page, never other clinics (business rule — no spying on competitors).

## Data models (Mongoose collections)

- **User** — role, name, email, phone, passHash, credits, clinicId (link for clinic owners)
- **Clinic** — name, area, address, phone, about, photo, amenities, opening hours (7 days), services[{name, mins, price, on}], rating + ratingCount (computed from reviews), verified / blocked (admin) / paused (owner) flags
- **Booking** — unique ref (SCH-2026-0001 via an atomic counter), patient, clinic, treatment, day/time slot, list price, discount %, credits used, final price, status: `pending → confirmed → completed` (or `cancelled`)
- **Review** — one per completed booking (enforced), rating 1–5, text
- **Application** — a clinic's join request: clinic info, PMC license number, owner's email + password hash (becomes the owner account on approval)

## The main flows

1. **Patient**: browse/filter clinics → clinic page → pick treatment, day, time slot → confirm → booking saved as *pending* → clinic accepts → visit happens → clinic marks *completed* → patient can leave a review.
2. **Clinic onboarding**: owner applies on the Join page (with email + password) → application lands in the admin's verification queue → admin works through a checklist and approves → the clinic document AND the owner's login are created automatically → owner signs in, sets services, prices, hours, photo → clinic is live.
3. **Admin**: live stats (clinics, patients, weekly bookings, 14-day chart), verification queue, clinic management (block/unblock/delete), patient list.

## Business logic I implemented (good interview talking points)

- **Slot availability**: one live booking per clinic/day/time. The server rejects a second booking of the same slot (409 conflict), and the UI greys taken slots out. Closed days are crossed out and also rejected server-side.
- **Credits & rewards**: +200 signup, +50 per booking, +20 per review. At 300 credits a patient can redeem **5% off**, at 600 **10% off** — the server validates the balance, deducts the credits, applies the discount, and **refunds the credits if the booking is cancelled or declined**.
- **Live ratings**: a clinic's rating is recomputed (MongoDB aggregation, average + count) every time a review is created — never a stored fake number.
- **Verification**: clinics only appear publicly when verified by the admin; blocked clinics vanish and can't be booked; owners can pause their own listing.
- **Atomic booking references**: `SCH-<year>-NNNN` from a counter document updated with `findByIdAndUpdate($inc)` — safe under concurrency.

## Problems I solved (the "tell me about a bug" question)

- **CSS class collision in a SPA**: all page stylesheets share one bundle, and a `.bar` class used by a chart leaked onto the footer's `.bar`, squeezing it into a 60px box. Fix: rename to a unique class (`.foot-bar`) — lesson: scope or namespace CSS in single-page apps.
- **Stale dev server**: the frontend proxies `/api` to a port; after the API moved ports, an old Vite process kept proxying to a dead port, which looked like "the whole site is broken" but was really one stale process.
- **Race condition on double booking**: checking "is the slot free?" in the UI isn't enough — two users can pass the check simultaneously, so the server re-checks at insert time.
- **React stale-state bug**: a checklist toggling multiple items in one tick lost updates because the handler read old state; fixed with a functional update (`setState(cur => ...)`).

## Security currently in place

- bcrypt-hashed passwords, JWT with server-side secret, role middleware on every protected route, server-side validation of all inputs (prices, slots, credits — never trusted from the client), admin account bootstrapped from environment variables, no secrets in the client code.

## Planned next (roadmap)

- **Email verification** (confirmation code or link on signup) and **phone OTP** via a real SMS gateway
- **Stronger password policy** (multiple character classes) and password reset
- Online payments, real SMS/WhatsApp booking reminders, photo uploads for applications
- **Deployment**: API on Render/Railway, frontend build on Vercel/Netlify, MongoDB Atlas (already in use)
- **iOS app**: wrap the built React app with Capacitor and point it at the deployed API
