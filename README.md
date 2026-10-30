# Skin Care Hub — MERN stack

A booking marketplace for skin care clinics in Peshawar: **M**ongoDB + **E**xpress + **R**eact + **N**ode. Built from the design in `D:\design`.

## Folders

```
client/   React app (Vite + React Router) — all 12 screens from the design
server/   Express API + Mongoose models (users, clinics, bookings, reviews, applications)
*.html    the original static prototype (kept as the design reference)
```

## Run it (two terminals)

```
cd server
npm start        # API on http://127.0.0.1:5001
```

```
cd client
npm run dev      # app on http://localhost:5173 (proxies /api to the server)
```

## Database

No MongoDB installed? The server automatically starts an **in-memory MongoDB** for development — everything works, but data resets when the server restarts. For persistent data, set `MONGODB_URI` in `server/.env` to a local MongoDB or a free MongoDB Atlas cluster, e.g.:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/skincarehub
```

There is **no demo data**. A fresh database starts empty; the only account created automatically is the Hub admin, taken from `server/.env`:

```
ADMIN_NAME=Hub Admin
ADMIN_EMAIL=admin@skincarehub.pk
ADMIN_PASSWORD=ChangeMe_Admin123   # change this!
```

To wipe an old database (demo data from earlier builds) run once:

```
cd server
node src/reset.js
```

## Accounts

- **Patients** sign up on /login (password hashed with bcrypt, +200 welcome credits).
- **Clinic owners** apply on /join with an email + password; when the admin approves the application, the clinic goes live and that email/password becomes the owner's sign-in.
- **Admin** comes from `.env` (above) and manages the verification queue, the clinics list (block / unblock / delete), and sees live stats and the 14-day bookings chart.

## Credits system

- **+200** welcome bonus on signup
- **+50** for every booking placed
- **+20** for every review
- Rewards: 5% off at 300 credits, 10% off at 600 (display only for now)

Credits live on the user document in MongoDB, so they follow the account across devices.

## How the flows connect

1. **Patient**: browse clinics (from MongoDB) → clinic page → pick treatment/day/time → sign in → confirm → booking saved as *pending*.
2. **Clinic owner**: dashboard lists live Hub bookings → Accept / Decline → Mark done after the visit.
3. **Patient**: completed visits can be reviewed (shown on the clinic's public page).
4. **New clinic**: Join form (with owner email + password) → admin verification queue → checklist-gated approve → clinic + owner account created and instantly live on /clinics.
5. **Clinic owner**: Services & schedule and Clinic profile pages save straight to MongoDB and update the public page immediately; ratings are recomputed from real reviews.

## API overview

```
POST /api/auth/signup | /auth/login                   GET /api/auth/me
GET  /api/clinics     | /api/clinics/:id
POST /api/bookings    GET /api/bookings/mine | /clinic   PATCH /api/bookings/:id/status
POST /api/reviews     GET /api/reviews/mine
POST /api/applications  GET /api/applications  PATCH|DELETE /api/applications/:id
GET  /api/me/clinic     PATCH /api/me/clinic   (owner edits services, hours, profile)
GET  /api/admin/stats   GET /api/admin/clinics PATCH|DELETE /api/admin/clinics/:id
```

Auth is JWT (`Authorization: Bearer <token>`); role checks guard clinic/admin routes.

## Next phase (iOS)

`cd client && npm run build`, then wrap `client/dist` with Capacitor (`npx cap init && npx cap add ios`) and point the app at your deployed API URL. Final build needs Xcode on a Mac (or a cloud Mac service).
