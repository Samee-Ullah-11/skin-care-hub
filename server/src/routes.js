import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Clinic, Booking, Review, Application, nextRef } from "./models.js";
import { sign, publicUser, requireAuth, requireRole } from "./auth.js";

const r = Router();
const CREDITS = { signup: 200, booking: 50, review: 20 };

/* ---------------- auth ---------------- */

r.post("/auth/signup", async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Please enter your full name." });
  if (!/^\S+@\S+\.\S+$/.test(String(email || ""))) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (String(phone || "").replace(/\D/g, "").length < 10) return res.status(400).json({ error: "Enter a valid phone number (03XX XXXXXXX)." });
  if (await User.findOne({ email: email.trim().toLowerCase() }))
    return res.status(409).json({ error: "An account with that email already exists — sign in instead." });
  const user = await User.create({
    role: "patient",
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone,
    passHash: bcrypt.hashSync(password, 10),
    credits: CREDITS.signup
  });
  res.json({ token: sign(user), user: publicUser(user) });
});

r.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user) return res.status(404).json({ error: "No account found with that email." });
  if (!user.passHash || !bcrypt.compareSync(password || "", user.passHash))
    return res.status(401).json({ error: "Incorrect password — try again." });
  res.json({ token: sign(user), user: publicUser(user) });
});

r.get("/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------------- clinics (public) ---------------- */

r.get("/clinics", async (_req, res) => {
  res.json({ clinics: await Clinic.find({ verified: true, blocked: { $ne: true }, paused: { $ne: true } }) });
});

r.get("/clinics/:id", async (req, res) => {
  const clinic = await Clinic.findById(req.params.id).catch(() => null);
  if (!clinic || clinic.blocked) return res.status(404).json({ error: "Clinic not found." });
  const reviews = await Review.find({ clinic: clinic._id }).populate("user", "name").sort("-createdAt").limit(20);
  // Slots that are already held by a live booking, so the picker can grey them out.
  const taken = await Booking.find(
    { clinic: clinic._id, status: { $in: ["pending", "confirmed"] } },
    "day time"
  );
  res.json({ clinic, reviews, taken: taken.map((t) => ({ day: t.day, time: t.time })) });
});

/* ---------------- clinic owner (dashboard) ---------------- */

async function ownClinic(req, res) {
  if (!req.user.clinicId) {
    res.status(404).json({ error: "No clinic is linked to this account." });
    return null;
  }
  const clinic = await Clinic.findById(req.user.clinicId);
  if (!clinic) {
    res.status(404).json({ error: "Your clinic was not found — contact the Hub admin." });
    return null;
  }
  return clinic;
}

r.get("/me/clinic", requireAuth, requireRole("clinic"), async (req, res) => {
  const clinic = await ownClinic(req, res);
  if (clinic) res.json({ clinic });
});

r.patch("/me/clinic", requireAuth, requireRole("clinic"), async (req, res) => {
  const clinic = await ownClinic(req, res);
  if (!clinic) return;
  const b = req.body || {};

  if (b.services !== undefined) {
    if (!Array.isArray(b.services) || b.services.length === 0)
      return res.status(400).json({ error: "Keep at least one service on your list." });
    for (const s of b.services) {
      if (!s.name || !String(s.name).trim()) return res.status(400).json({ error: "Every service needs a name." });
      const mins = Number(s.mins), price = Number(s.price);
      if (!Number.isFinite(mins) || mins < 5 || mins > 300) return res.status(400).json({ error: "Duration must be between 5 and 300 minutes (" + s.name + ")." });
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "Enter a valid price for " + s.name + "." });
    }
    clinic.services = b.services.map((s) => ({
      name: String(s.name).trim(),
      mins: Number(s.mins),
      price: Number(s.price),
      on: !!s.on
    }));
  }
  if (b.hours !== undefined) {
    if (!Array.isArray(b.hours) || b.hours.length !== 7)
      return res.status(400).json({ error: "Opening hours must cover all 7 days." });
    clinic.hours = b.hours.map((h) => ({
      d: String(h.d || ""), open: String(h.open || ""), close: String(h.close || ""), closed: !!h.closed
    }));
  }
  if (b.name !== undefined) {
    if (!String(b.name).trim()) return res.status(400).json({ error: "The clinic name cannot be empty." });
    clinic.name = String(b.name).trim();
  }
  for (const k of ["area", "address", "phone", "about", "photo"]) {
    if (b[k] !== undefined) clinic[k] = String(b[k]).trim();
  }
  if (b.amenities !== undefined && Array.isArray(b.amenities)) clinic.amenities = b.amenities.map(String).slice(0, 12);
  if (b.paused !== undefined) clinic.paused = !!b.paused;

  await clinic.save();
  res.json({ clinic });
});

/* ---------------- bookings ---------------- */

r.post("/bookings", requireAuth, async (req, res) => {
  if (req.user.role !== "patient")
    return res.status(403).json({ error: "Only patient accounts can book appointments." });
  const b = req.body || {};
  if (!b.patientName) return res.status(400).json({ error: "Please enter your full name." });
  if (String(b.patientPhone || "").replace(/\D/g, "").length < 10)
    return res.status(400).json({ error: "Enter a valid phone number (03XX XXXXXXX)." });
  const clinic = await Clinic.findById(b.clinicId).catch(() => null);
  if (!clinic || clinic.blocked) return res.status(400).json({ error: "Clinic not found." });
  if (clinic.paused || !clinic.verified)
    return res.status(400).json({ error: "This clinic is not accepting bookings right now." });
  const dayName = String(b.day || "").slice(0, 3);
  const dayHours = (clinic.hours || []).find((h) => h.d === dayName);
  if (dayHours && dayHours.closed)
    return res.status(400).json({ error: "The clinic is closed on " + dayName + " — pick another day." });

  // One live booking per clinic slot.
  const clash = await Booking.findOne({
    clinic: clinic._id, day: b.day, time: b.time,
    status: { $in: ["pending", "confirmed"] }
  });
  if (clash)
    return res.status(409).json({ error: "That time has just been booked by someone else — please pick another slot." });

  // Redeem credits for a discount: 300 credits → 5% off, 600 → 10% off.
  const useCredits = Number(b.useCredits) || 0;
  if (![0, 300, 600].includes(useCredits))
    return res.status(400).json({ error: "Invalid credits amount." });
  if (useCredits > req.user.credits)
    return res.status(400).json({ error: "You don't have enough credits for that reward." });
  const discountPct = useCredits === 600 ? 10 : useCredits === 300 ? 5 : 0;
  const listPrice = Number(b.price) || 0;
  const finalPrice = Math.round(listPrice * (1 - discountPct / 100));

  const booking = await Booking.create({
    ref: await nextRef(),
    user: req.user._id,
    clinic: clinic._id,
    clinicName: clinic.name,
    clinicPhoto: clinic.photo,
    address: clinic.address,
    treatment: b.treatment,
    price: finalPrice,
    listPrice,
    discountPct,
    creditsUsed: useCredits,
    mins: b.mins,
    day: b.day,
    time: b.time,
    patientName: b.patientName,
    patientPhone: b.patientPhone,
    pref: b.pref,
    note: b.note
  });
  req.user.credits += CREDITS.booking - useCredits;
  await req.user.save();
  res.json({ booking, user: publicUser(req.user) });
});

r.get("/bookings/mine", requireAuth, async (req, res) => {
  res.json({ bookings: await Booking.find({ user: req.user._id }).sort("-createdAt") });
});

r.get("/bookings/clinic", requireAuth, requireRole("clinic"), async (req, res) => {
  if (!req.user.clinicId) return res.json({ bookings: [] });
  res.json({ bookings: await Booking.find({ clinic: req.user.clinicId }).sort("-createdAt") });
});

r.patch("/bookings/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "confirmed", "completed", "cancelled"].includes(status))
    return res.status(400).json({ error: "Invalid status." });
  const booking = await Booking.findById(req.params.id).catch(() => null);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  const isOwner = String(booking.user) === String(req.user._id);
  const isClinic = req.user.role === "clinic" && String(booking.clinic) === String(req.user.clinicId);
  const isAdmin = req.user.role === "admin";
  if (status === "cancelled" ? !(isOwner || isClinic || isAdmin) : !(isClinic || isAdmin))
    return res.status(403).json({ error: "You cannot change this booking." });
  // Refund redeemed credits when a live booking is cancelled or declined.
  if (status === "cancelled" && ["pending", "confirmed"].includes(booking.status) && booking.creditsUsed) {
    await User.findByIdAndUpdate(booking.user, { $inc: { credits: booking.creditsUsed } });
  }
  booking.status = status;
  await booking.save();
  res.json({ booking });
});

/* ---------------- reviews ---------------- */

async function recalcRating(clinicId) {
  const [agg] = await Review.aggregate([
    { $match: { clinic: clinicId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  await Clinic.findByIdAndUpdate(clinicId, {
    rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.count : 0
  });
}

r.post("/reviews", requireAuth, async (req, res) => {
  const { bookingId, rating, text } = req.body || {};
  const booking = await Booking.findById(bookingId).catch(() => null);
  if (!booking || String(booking.user) !== String(req.user._id))
    return res.status(404).json({ error: "Booking not found." });
  if (booking.status !== "completed")
    return res.status(400).json({ error: "You can only review completed visits." });
  if (await Review.findOne({ booking: booking._id }))
    return res.status(409).json({ error: "You already reviewed this visit." });
  const review = await Review.create({
    booking: booking._id,
    user: req.user._id,
    clinic: booking.clinic,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text: String(text || "").slice(0, 1000)
  });
  await recalcRating(booking.clinic);
  req.user.credits += CREDITS.review;
  await req.user.save();
  res.json({ review, user: publicUser(req.user) });
});

r.get("/reviews/mine", requireAuth, async (req, res) => {
  res.json({ reviews: await Review.find({ user: req.user._id }) });
});

/* ---------------- clinic applications ---------------- */

r.post("/applications", async (req, res) => {
  const a = req.body || {};
  for (const [field, msg] of [
    ["clinic", "Please enter your clinic name."],
    ["owner", "Please enter the owner or manager name."],
    ["address", "Please enter the clinic address."],
    ["license", "The PMC / practice license number is required for verification."]
  ]) {
    if (!a[field] || !String(a[field]).trim()) return res.status(400).json({ error: msg });
  }
  if (!/^\S+@\S+\.\S+$/.test(String(a.email || "")))
    return res.status(400).json({ error: "Enter a valid email — it becomes your sign-in once approved." });
  if (!a.password || a.password.length < 8)
    return res.status(400).json({ error: "Choose a password of at least 8 characters." });
  if (String(a.phone || "").replace(/\D/g, "").length < 10)
    return res.status(400).json({ error: "Enter a valid phone number (03XX XXXXXXX)." });
  const email = String(a.email).trim().toLowerCase();
  if (await User.findOne({ email }))
    return res.status(409).json({ error: "That email already has an account — use a different one." });
  if (await Application.findOne({ email, status: "pending" }))
    return res.status(409).json({ error: "An application with that email is already under review." });
  const app = await Application.create({
    clinic: a.clinic, owner: a.owner, email, passHash: bcrypt.hashSync(a.password, 10),
    phone: a.phone, area: a.area, address: a.address, license: a.license,
    services: a.services || [], note: a.note
  });
  res.json({ application: app });
});

r.get("/applications", requireAuth, requireRole("admin"), async (_req, res) => {
  const applications = await Application.find().sort("-createdAt");
  res.json({ applications: applications.map((a) => { const o = a.toObject(); delete o.passHash; return o; }) });
});

r.patch("/applications/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { status, adminNote } = req.body || {};
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status." });
  const app = await Application.findById(req.params.id).catch(() => null);
  if (!app) return res.status(404).json({ error: "Application not found." });
  if (app.status !== "pending") return res.status(409).json({ error: "This application has already been decided." });
  if (status === "approved" && app.email && (await User.findOne({ email: app.email })))
    return res.status(409).json({ error: "The applicant's email now belongs to an existing account — reject with a note instead." });
  app.status = status;
  app.adminNote = adminNote || "";
  await app.save();
  if (status === "approved") {
    const clinic = await Clinic.create({
      name: app.clinic, area: app.area, address: app.address, phone: app.phone, verified: true,
      services: (app.services || []).map((s) => ({ name: s, mins: 30, price: 3000, on: true }))
    });
    if (app.email && app.passHash) {
      await User.create({
        role: "clinic", name: app.owner, email: app.email, phone: app.phone,
        passHash: app.passHash, credits: 0, clinicId: clinic._id
      });
    }
  }
  const out = app.toObject();
  delete out.passHash;
  res.json({ application: out });
});

r.delete("/applications/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const app = await Application.findById(req.params.id).catch(() => null);
  if (!app) return res.status(404).json({ error: "Application not found." });
  await app.deleteOne();
  res.json({ ok: true });
});

/* ---------------- admin ---------------- */

r.get("/admin/stats", requireAuth, requireRole("admin"), async (_req, res) => {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekAgo = new Date(now - 7 * dayMs);
  const twoWeeksAgo = new Date(now - 14 * dayMs);

  const [clinics, pendingApps, patients, bookingsTotal, bookingsWeek, bookingsPrevWeek] = await Promise.all([
    Clinic.countDocuments({ blocked: { $ne: true } }),
    Application.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "patient" }),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: weekAgo } }),
    Booking.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } })
  ]);

  // Bookings per day for the last 14 days (for the admin chart).
  const since = new Date(now - 13 * dayMs);
  since.setHours(0, 0, 0, 0);
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
  ]);
  const byKey = Object.fromEntries(rows.map((x) => [x._id, x.count]));
  const byDay = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: byKey[key] || 0 });
  }

  res.json({ clinics, pendingApps, patients, bookingsTotal, bookingsWeek, bookingsPrevWeek, byDay });
});

r.get("/admin/users", requireAuth, requireRole("admin"), async (_req, res) => {
  const users = await User.find({ role: "patient" }, "name email phone credits createdAt").sort("-createdAt");
  const counts = await Booking.aggregate([{ $group: { _id: "$user", n: { $sum: 1 } } }]);
  const byUser = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({
    users: users.map((u) => {
      const o = u.toObject();
      o.bookings = byUser[String(u._id)] || 0;
      return o;
    })
  });
});

r.get("/admin/clinics", requireAuth, requireRole("admin"), async (_req, res) => {
  const clinics = await Clinic.find().sort("-createdAt");
  const owners = await User.find({ role: "clinic", clinicId: { $ne: null } }, "email clinicId");
  const ownerBy = Object.fromEntries(owners.map((u) => [String(u.clinicId), u.email]));
  res.json({
    clinics: clinics.map((c) => {
      const o = c.toObject();
      o.ownerEmail = ownerBy[String(c._id)] || null;
      return o;
    })
  });
});

r.patch("/admin/clinics/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const clinic = await Clinic.findById(req.params.id).catch(() => null);
  if (!clinic) return res.status(404).json({ error: "Clinic not found." });
  const b = req.body || {};
  if (b.blocked !== undefined) clinic.blocked = !!b.blocked;
  if (b.verified !== undefined) clinic.verified = !!b.verified;
  await clinic.save();
  res.json({ clinic });
});

r.delete("/admin/clinics/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const clinic = await Clinic.findById(req.params.id).catch(() => null);
  if (!clinic) return res.status(404).json({ error: "Clinic not found." });
  await Booking.updateMany(
    { clinic: clinic._id, status: { $in: ["pending", "confirmed"] } },
    { status: "cancelled" }
  );
  await Review.deleteMany({ clinic: clinic._id });
  await User.deleteMany({ role: "clinic", clinicId: clinic._id });
  await clinic.deleteOne();
  res.json({ ok: true });
});

export default r;
