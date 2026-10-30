/* ============================================================
   Skin Care Hub — client-side data store (localStorage)
   Acts as the "backend" for the static site; the same layer
   keeps working unchanged inside the Capacitor iOS wrapper.
   ============================================================ */
(function () {
  const DB_KEY = "sch-db-v2";

  const SEED = {
    users: [
      { id: "u-sana",  role: "patient", name: "Sana Khan",      email: "sana@demo.pk",   phone: "0345 1234567", pass: "sana123",   credits: 200 },
      { id: "u-owner", role: "clinic",  name: "Dr. Amna Javed", email: "clinic@demo.pk", phone: "0300 1112233", pass: "clinic123", credits: 0, clinicId: "c-sample" },
      { id: "u-admin", role: "admin",   name: "Hub Admin",      email: "admin@demo.pk",  phone: "0333 9998877", pass: "admin123",  credits: 0 }
    ],
    clinics: [
      {
        id: "c-sample",
        name: "Sample Skin Clinic",
        area: "Hayatabad Phase 3",
        address: "Street 12, Hayatabad Phase 3, Peshawar",
        rating: 4.8,
        verified: true,
        photo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80&auto=format&fit=crop",
        services: [
          { name: "Hydrafacial",           mins: 60, price: 6500, on: true },
          { name: "Signature Glow Facial", mins: 45, price: 3500, on: true },
          { name: "Chemical Peel",         mins: 30, price: 5000, on: true },
          { name: "Carbon Laser Facial",   mins: 40, price: 8000, on: true },
          { name: "Skin Consultation",     mins: 20, price: 1500, on: true }
        ]
      }
    ],
    session: null,
    bookings: [],
    reviews: [],
    applications: [
      { id: "a-noor", status: "pending", at: 0, clinic: "Sample Noor Clinic", owner: "Dr. Noor Fatima", phone: "0301 2223344", area: "University Town", address: "Jamrud Road, University Town, Peshawar", license: "PMC-NA-48213", services: ["Facials", "Acne Care"], note: "" },
      { id: "a-glow", status: "pending", at: -1, clinic: "Sample Glow House", owner: "Hira Shah", phone: "0312 5556677", area: "Saddar", address: "Cantt Plaza, Saddar Road, Peshawar", license: "PMC-GH-77109", services: ["Whitening", "Laser"], note: "Ladies-only clinic" }
    ],
    seq: 1
  };

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const db = JSON.parse(JSON.stringify(SEED));
    save(db);
    return db;
  }

  function save(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      // compat flag used by the nav scripts shipped with the design
      if (db.session) localStorage.setItem("schUser", "1");
      else localStorage.removeItem("schUser");
    } catch (e) {}
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  const SCH = {
    _db: null,
    get db() {
      if (!this._db) this._db = load();
      return this._db;
    },
    commit() { save(this.db); },

    /* ---------- auth ---------- */
    user() {
      const s = this.db.session;
      if (!s) return null;
      return this.db.users.find(u => u.id === s.userId) || null;
    },
    signIn(email, pass) {
      const u = this.db.users.find(
        u => u.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (!u) return { ok: false, error: "No account found with that email." };
      if (u.pass !== pass) return { ok: false, error: "Incorrect password — try again." };
      this.db.session = { userId: u.id, at: Date.now() };
      this.commit();
      return { ok: true, user: u };
    },
    signInPhone(phone) {
      const p = String(phone).replace(/\D/g, "");
      if (p.length < 10) return { ok: false, error: "Enter a valid phone number (03XX XXXXXXX)." };
      let u = this.db.users.find(x => x.phone.replace(/\D/g, "") === p);
      if (!u) {
        u = { id: uid("u"), role: "patient", name: "Guest " + p.slice(-4), email: "", phone: phone, pass: "", credits: 200 };
        this.db.users.push(u);
      }
      this.db.session = { userId: u.id, at: Date.now() };
      this.commit();
      return { ok: true, user: u };
    },
    signUp(name, email, pass, phone) {
      if (!name || !name.trim()) return { ok: false, error: "Please enter your full name." };
      if (!/^\S+@\S+\.\S+$/.test(String(email))) return { ok: false, error: "Please enter a valid email address." };
      if (!pass || pass.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
      if (String(phone).replace(/\D/g, "").length < 10) return { ok: false, error: "Enter a valid phone number (03XX XXXXXXX)." };
      if (this.db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase()))
        return { ok: false, error: "An account with that email already exists — sign in instead." };
      const u = { id: uid("u"), role: "patient", name: name.trim(), email: email.trim(), phone: phone, pass: pass, credits: 200 };
      this.db.users.push(u);
      this.db.session = { userId: u.id, at: Date.now() };
      this.commit();
      return { ok: true, user: u };
    },
    signOut() {
      this.db.session = null;
      this.commit();
    },
    require(role, redirect) {
      const u = this.user();
      if (!u || (role && u.role !== role && u.role !== "admin")) {
        window.location.replace(redirect || "login.html");
        return null;
      }
      return u;
    },
    addCredits(n) {
      const u = this.user();
      if (!u) return 0;
      u.credits = (u.credits || 0) + n;
      this.commit();
      return u.credits;
    },

    /* ---------- clinics ---------- */
    clinic(id) {
      return this.db.clinics.find(c => c.id === id) || this.db.clinics[0];
    },

    /* ---------- pending booking selection (clinic.html → booking.html) ---------- */
    setPending(sel) {
      try { sessionStorage.setItem("sch-pending", JSON.stringify(sel)); } catch (e) {}
    },
    pending() {
      try {
        const raw = sessionStorage.getItem("sch-pending");
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    clearPending() {
      try { sessionStorage.removeItem("sch-pending"); } catch (e) {}
    },

    /* ---------- bookings ---------- */
    createBooking(data) {
      const u = this.user();
      if (!u) return { ok: false, error: "Sign in first." };
      const n = this.db.seq++;
      const ref = "SCH-2026-" + String(n).padStart(4, "0");
      const b = Object.assign({
        id: uid("b"),
        ref: ref,
        userId: u.id,
        clinicId: "c-sample",
        status: "pending",
        createdAt: Date.now()
      }, data);
      this.db.bookings.push(b);
      u.credits = (u.credits || 0) + 50;
      this.commit();
      return { ok: true, booking: b };
    },
    myBookings() {
      const u = this.user();
      if (!u) return [];
      return this.db.bookings.filter(b => b.userId === u.id).sort((a, b) => b.createdAt - a.createdAt);
    },
    clinicBookings(clinicId) {
      return this.db.bookings.filter(b => b.clinicId === clinicId).sort((a, b) => b.createdAt - a.createdAt);
    },
    cancelBooking(id) {
      return this.setBookingStatus(id, "cancelled");
    },
    setBookingStatus(id, status) {
      const b = this.db.bookings.find(x => x.id === id);
      if (b) { b.status = status; this.commit(); }
      return b;
    },

    /* ---------- reviews ---------- */
    addReview(bookingId, rating, text) {
      const u = this.user();
      if (!u) return null;
      const r = { id: uid("r"), bookingId: bookingId, userId: u.id, rating: rating, text: text, at: Date.now() };
      this.db.reviews.push(r);
      u.credits = (u.credits || 0) + 20;
      this.commit();
      return r;
    },
    reviewFor(bookingId) {
      return this.db.reviews.find(r => r.bookingId === bookingId) || null;
    },

    /* ---------- clinic applications (join.html → admin) ---------- */
    addApplication(app) {
      const a = Object.assign({ id: uid("a"), status: "pending", at: Date.now() }, app);
      this.db.applications.push(a);
      this.commit();
      return a;
    },
    applications() {
      return this.db.applications.slice().sort((a, b) => b.at - a.at);
    },
    setApplication(id, status, note) {
      const a = this.db.applications.find(x => x.id === id);
      if (a) { a.status = status; a.note = note || ""; this.commit(); }
      return a;
    },

    /* ---------- misc ---------- */
    money(n) { return "Rs. " + Number(n).toLocaleString("en-PK"); },
    reset() {
      try { localStorage.removeItem(DB_KEY); localStorage.removeItem("schUser"); } catch (e) {}
      this._db = null;
    }
  };

  window.SCH = SCH;
})();
