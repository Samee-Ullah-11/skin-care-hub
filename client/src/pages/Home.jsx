import "./home.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";
import { ClinicCard } from "./Clinics";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [clinics, setClinics] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  useEffect(() => {
    api("/clinics").then((d) => setClinics(d.clinics)).catch(() => { setClinics([]); setLoadErr(true); });
  }, []);
  useReveal([clinics]);

  const list = clinics || [];
  const treatments = list.reduce((n, c) => n + (c.services || []).filter((s) => s.on).length, 0);
  const rated = list.filter((c) => c.ratingCount > 0);
  const avgRating = rated.length ? rated.reduce((n, c) => n + c.rating, 0) / rated.length : null;
  const featured = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);

  function search(e) {
    e.preventDefault();
    navigate("/clinics" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""));
  }

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8"/></svg>
                Peshawar's Skin Clinic Marketplace
              </span>
              <h1>Your skin deserves <em>a little calm</em></h1>
              <p>Find trusted skin care and aesthetic clinics across Peshawar, compare treatments, and book an appointment in minutes.</p>
            </div>
      
            <div className="hero-actions">
              <form className="hero-search" onSubmit={search}>
                <div className="cell">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4c2.4 3.2 4.8 5.2 4.8 8.8A5.6 5.6 0 0 1 11 18.3" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11" cy="12.6" r="5.7" stroke="#6E9A82" strokeWidth="1.8"/><path d="M20 21l-3.6-3.6" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  <input type="text" placeholder="Treatment, e.g. Hydrafacial" aria-label="Search treatment" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="cell">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M12 7.2c1.5 2 3 3.2 3 5a3 3 0 1 1-6 0c0-1.8 1.5-3 3-5Z" stroke="#6E9A82" strokeWidth="1.5"/></svg>
                  <select aria-label="Choose area">
                    <option>All areas</option>
                    <option>Hayatabad</option>
                    <option>University Town</option>
                    <option>Saddar</option>
                    <option>Gulbahar</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Search</button>
              </form>
      
              <div className="hero-stats">
                <div className="stat"><strong>{clinics === null ? "…" : list.length}</strong><span>Partner clinic{list.length === 1 ? "" : "s"}</span></div>
                <div className="stat"><strong>{clinics === null ? "…" : treatments}</strong><span>Treatment{treatments === 1 ? "" : "s"} to book</span></div>
                <div className="stat"><strong>Free</strong><span>Booking fee</span></div>
              </div>
            </div>
      
            <div className="hero-visual">
              <div className="main-photo" aria-hidden="true" style={{ display: "grid", placeItems: "center" }}>
                <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#C9A27E" strokeOpacity="0.55" strokeWidth="1.2" />
                  <path d="M12 10v7" stroke="#C9A27E" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
              <div className="hero-float fl-rating">
                <span className="ic">
                  <svg width="19" height="19" viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" fill="#C9A27E"/></svg>
                </span>
                <div>
                  {avgRating
                    ? <><strong>{avgRating.toFixed(1)} rating</strong><span>average from patient reviews</span></>
                    : <><strong>Honest ratings</strong><span>from completed visits only</span></>}
                </div>
              </div>
              <div className="hero-float fl-verified">
                <span className="ic">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div><strong>Verified clinics</strong><span>checked before listing</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* WHO ARE YOU */}
      <section className="audience">
        <div className="container">
          <div className="aud-grid">
            <div className="aud-card reveal">
              <span className="ic">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8"/><path d="M12 10v7" stroke="#2F4A3C" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </span>
              {!user ? (
                <>
                  <h3>I'm looking after my skin</h3>
                  <p>Create a free account to book verified clinics, keep every visit in one place and earn Hub credits towards discounts.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/login#signup">Sign up free</a>
                  </div>
                </>
              ) : user.role === "patient" ? (
                <>
                  <h3>Welcome back, {(user.name || "").split(" ")[0]}</h3>
                  <p>Pick your next treatment, keep every visit in one place and earn Hub credits towards discounts.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/clinics">Browse clinics</a>
                    <a className="btn btn-ghost" href="/bookings">My bookings</a>
                  </div>
                </>
              ) : user.role === "clinic" ? (
                <>
                  <h3>How patients see you</h3>
                  <p>Open your public page to check exactly what patients find when they discover your clinic.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href={user.clinicId ? "/clinics/" + user.clinicId : "/dashboard"}>View your public page</a>
                  </div>
                </>
              ) : (
                <>
                  <h3>Browse the Hub</h3>
                  <p>See the clinics patients find when they search — every listing is verified before it goes live.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/clinics">Browse clinics</a>
                  </div>
                </>
              )}
            </div>
            <div className="aud-card forest reveal d1">
              <span className="ic">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 20V9.5L12 4l8 5.5V20" stroke="#C9A27E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 20v-5h5v5" stroke="#C9A27E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              {user && user.role === "clinic" ? (
                <>
                  <h3>Your clinic</h3>
                  <p>Manage bookings, services and your profile — changes go live on your public page right away.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/dashboard">Open dashboard</a>
                    <a className="btn btn-ghost" href={user.clinicId ? "/clinics/" + user.clinicId : "/clinics"}>View public page</a>
                  </div>
                </>
              ) : user && user.role === "admin" ? (
                <>
                  <h3>Hub operations</h3>
                  <p>Review new clinic applications, watch live booking numbers and manage the clinics on the Hub.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/admin">Open admin console</a>
                  </div>
                </>
              ) : (
                <>
                  <h3>I run a clinic</h3>
                  <p>List your clinic on the Hub — free listing, verification in about 2 days, and bookings arrive straight in your dashboard.</p>
                  <div className="acts">
                    <a className="btn btn-primary" href="/join">List your clinic</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* CATEGORIES */}
      <section className="categories" id="treatments">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Treatments</span>
            <h2>What does your skin need today?</h2>
            <p>Browse by treatment and find the clinics that do it best.</p>
          </div>
          <div className="cat-grid">
            <a className="cat-card reveal" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.5 14a2.5 2.5 0 0 0 5 0" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
              <strong>Facials</strong>
              <span>Glow &amp; hydration</span>
            </a>
            <a className="cat-card reveal d1" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 20L14.5 9.5M17 7l2.2-2.2M14.5 9.5l-1.8-1.8M14.5 9.5l1.8 1.8" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><path d="M19.5 4.5c.8.8.8 2 0 2.8l-1.4 1.4-2.8-2.8 1.4-1.4c.8-.8 2-.8 2.8 0Z" stroke="#6E9A82" strokeWidth="1.6"/></svg></span>
              <strong>Laser</strong>
              <span>Hair &amp; skin laser</span>
            </a>
            <a className="cat-card reveal d2" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#6E9A82" strokeWidth="1.8"/><circle cx="9.5" cy="10" r="1.1" fill="#6E9A82"/><circle cx="14.5" cy="13.5" r="1.1" fill="#6E9A82"/><circle cx="11" cy="15.5" r="0.9" fill="#6E9A82"/></svg></span>
              <strong>Acne Care</strong>
              <span>Treatment plans</span>
            </a>
            <a className="cat-card reveal d3" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-1.5-7-5-7-9.5C8 10 10.5 8 12 4c1.5 4 4 6 7 7.5 0 4.5-3 8-7 9.5Z" stroke="#6E9A82" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 9v8" stroke="#6E9A82" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
              <strong>Anti-Aging</strong>
              <span>Fine lines &amp; firmness</span>
            </a>
            <a className="cat-card reveal d4" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" stroke="#6E9A82" strokeWidth="1.8" strokeLinejoin="round"/></svg></span>
              <strong>Whitening</strong>
              <span>Tone &amp; brightening</span>
            </a>
            <a className="cat-card reveal d4" href="#clinics">
              <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 19c2-5 4.5-8 7-10M12 9c2.5 2 5 5 7 10" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 9c-1.5-1.8-1.5-4 0-5.5C13.5 5 13.5 7.2 12 9Z" stroke="#6E9A82" strokeWidth="1.6"/></svg></span>
              <strong>Hair &amp; Scalp</strong>
              <span>PRP &amp; restoration</span>
            </a>
          </div>
        </div>
      </section>
      
      {/* FEATURED CLINICS */}
      <section className="featured" id="clinics">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Featured</span>
            <h2>Clinics patients love</h2>
            <p>The highest-rated verified clinics on the Hub right now.</p>
          </div>
          <div className="clinic-grid">
            {clinics === null && <p style={{ color: "var(--ink-soft)" }}>Loading clinics…</p>}
            {clinics !== null && featured.length === 0 && (
              <p style={{ color: "var(--ink-soft)" }}>
                {loadErr
                  ? "We couldn't load the clinics — check your connection and refresh the page."
                  : <>No clinics are live yet — new clinics appear here as soon as they're verified. Run a clinic? <Link to="/join" style={{ color: "var(--forest)", fontWeight: 800 }}>Apply to join</Link>.</>}
              </p>
            )}
            {featured.map((c, i) => <ClinicCard key={c._id} clinic={c} delay={i} />)}
          </div>
          <div className="more reveal">
            <a className="btn btn-secondary" href="/clinics">View all clinics</a>
          </div>
        </div>
      </section>
      
      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Simple</span>
            <h2>Booked in three gentle steps</h2>
            <p>No phone calls, no waiting rooms full of guesswork.</p>
          </div>
          <div className="how-grid">
            <div className="how-card reveal">
              <span className="step">01</span>
              <span className="ic">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M11 4c2.4 3.2 4.8 5.2 4.8 8.8A5.6 5.6 0 0 1 11 18.3" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11" cy="12.6" r="5.7" stroke="#6E9A82" strokeWidth="1.8"/><path d="M20 21l-3.6-3.6" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </span>
              <h3>Search &amp; compare</h3>
              <p>Browse clinics by treatment, area, price and verified patient ratings.</p>
            </div>
            <div className="how-card reveal d1">
              <span className="step">02</span>
              <span className="ic">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.8"/><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12.6c1 1.3 2 2.1 2 3.3a2 2 0 1 1-4 0c0-1.2 1-2 2-3.3Z" stroke="#6E9A82" strokeWidth="1.5"/></svg>
              </span>
              <h3>Pick a time</h3>
              <p>See real availability and choose a slot that fits your day — morning or evening.</p>
            </div>
            <div className="how-card reveal d2">
              <span className="step">03</span>
              <span className="ic">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <h3>Walk in relaxed</h3>
              <p>Your booking is confirmed instantly, with reminders before your visit.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* WHY US */}
      <section className="why">
        <div className="container">
          <div className="why-wrap reveal">
            <div>
              <span className="eyebrow" style={{ background: "rgba(255,255,255,0.7)" }}>Why Skin Care Hub</span>
              <h2>Calm choices, trusted hands</h2>
              <p className="lead">Every clinic on the Hub is checked before it's listed, so you can focus on your skin — not on second-guessing.</p>
            </div>
            <div className="why-list">
              <div className="why-item">
                <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <div><strong>Verified clinics only</strong><span>Licenses and credentials checked before listing.</span></div>
              </div>
              <div className="why-item">
                <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" stroke="#6E9A82" strokeWidth="1.8" strokeLinejoin="round"/></svg></span>
                <div><strong>Honest patient ratings</strong><span>Reviews come only from completed bookings.</span></div>
              </div>
              <div className="why-item">
                <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.8"/><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12.6c1 1.3 2 2.1 2 3.3a2 2 0 1 1-4 0c0-1.2 1-2 2-3.3Z" stroke="#6E9A82" strokeWidth="1.5"/></svg></span>
                <div><strong>Free cancellation</strong><span>Plans change — reschedule up to 12 hours before.</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="cta">
        <div className="container">
          <div className="cta-band reveal">
            <svg className="drop-deco l" width="80" height="80" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#FFFBF7" strokeWidth="1.4"/></svg>
            <svg className="drop-deco r" width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#FFFBF7" strokeWidth="1.4"/></svg>
            <h2>Ready when your skin is</h2>
            <p>Join Skin Care Hub and book your first appointment with a clinic you can trust.</p>
            <a className="btn btn-primary" href="#clinics">Find a clinic</a>
          </div>
        </div>
      </section>
    </>
  );
}
