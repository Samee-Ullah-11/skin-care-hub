import "./clinic.css";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SLOTS = ["10:00", "11:30", "1:00", "3:30", "5:00", "6:30"];

function Stars({ rating, count }) {
  const full = Math.round(rating);
  return (
    <span className="item stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24">
          <path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" fill={i <= full ? "#C9A27E" : "#EDE2D3"} />
        </svg>
      ))}
      <span className="score">{rating.toFixed(1)}</span>
      <span className="count">({count} review{count === 1 ? "" : "s"})</span>
    </span>
  );
}

function todayHours(clinic) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (clinic.hours || []).find((h) => h.d === names[new Date().getDay()]) || null;
}

export default function Clinic() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [taken, setTaken] = useState([]);
  const [missing, setMissing] = useState(false);

  const days = useMemo(() => {
    return [0, 1, 2, 3, 4].map((i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        label: DAY_NAMES[d.getDay()],
        num: d.getDate(),
        full: DAY_NAMES[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear()
      };
    });
  }, []);

  const [service, setService] = useState(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState("3:30");
  const [slotErr, setSlotErr] = useState("");

  useEffect(() => {
    api("/clinics/" + id)
      .then((d) => {
        setClinic(d.clinic);
        setReviews(d.reviews || []);
        setTaken(d.taken || []);
        const first = (d.clinic.services || []).find((s) => s.on);
        setService(first ? first.name : null);
        // Pre-select the first day the clinic is actually open.
        const closed = new Set((d.clinic.hours || []).filter((h) => h.closed).map((h) => h.d));
        const openIdx = days.findIndex((dd) => !closed.has(dd.label));
        if (openIdx > 0) setDayIdx(openIdx);
      })
      .catch(() => setMissing(true));
  }, [id, days]);

  useReveal([clinic]);

  // A clinic account may only view its own public page.
  if (user && user.role === "clinic" && user.clinicId && id !== String(user.clinicId)) {
    return <Navigate to={"/clinics/" + user.clinicId} replace />;
  }

  if (missing) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <h1>Clinic not found</h1>
        <p style={{ color: "var(--ink-soft)", margin: "12px 0 24px" }}>It may have been removed from the Hub.</p>
        <Link className="btn btn-primary" to="/clinics">Browse clinics</Link>
      </div>
    );
  }
  if (!clinic) return <div className="container" style={{ padding: "80px 24px", textAlign: "center", color: "var(--ink-soft)" }}>Loading clinic…</div>;

  const services = (clinic.services || []).filter((s) => s.on);
  const selected = services.find((s) => s.name === service) || services[0];
  const closedDays = new Set((clinic.hours || []).filter((h) => h.closed).map((h) => h.d));
  const takenTimes = new Set(taken.filter((t) => t.day === days[dayIdx].full).map((t) => t.time));
  const roleHome = user && user.role === "clinic" ? "/dashboard" : user && user.role === "admin" ? "/admin" : "/";

  function confirm() {
    if (!selected) return;
    if (closedDays.has(days[dayIdx].label)) { setSlotErr("The clinic is closed that day — pick another day."); return; }
    if (!slot || takenTimes.has(slot)) { setSlotErr("Please pick an available time first."); return; }
    sessionStorage.setItem("sch-pending", JSON.stringify({
      clinicId: clinic._id,
      clinic: clinic.name,
      address: clinic.address,
      treatment: selected.name,
      price: selected.price,
      mins: selected.mins,
      day: days[dayIdx].full,
      time: slot,
      photo: clinic.photo || ""
    }));
    navigate(user ? "/booking" : "/login?next=/booking");
  }

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={roleHome}>{roleHome === "/dashboard" ? "Dashboard" : roleHome === "/admin" ? "Admin" : "Home"}</Link><span className="sep">·</span>
        <Link to="/clinics">Clinics</Link><span className="sep">·</span>
        <span className="here">{clinic.name}</span>
      </nav>

      <div className="gallery reveal">
        <div className="shot main">
          <span className="ph-note">Clinic photo</span>
          {clinic.photo && <img src={clinic.photo} alt={clinic.name} onError={(e) => e.currentTarget.remove()} />}
          <div className="badges">
            {clinic.verified && (
              <span className="badge badge-verified">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Verified
              </span>
            )}
          </div>
        </div>
        <div className="shot">
          <span className="ph-note">Clinic photo</span>
        </div>
        <div className="shot">
          <span className="ph-note">Clinic photo</span>
        </div>
      </div>

      <div className="clinic-head reveal">
        <div>
          <h1>{clinic.name}</h1>
          <div className="meta">
            <span className="item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 7.2c1.5 2 3 3.2 3 5a3 3 0 1 1-6 0c0-1.8 1.5-3 3-5Z" stroke="#6E9A82" strokeWidth="1.5" /></svg>
              {clinic.address}
            </span>
            {clinic.ratingCount > 0 ? <Stars rating={clinic.rating} count={clinic.ratingCount} /> : <span className="item count" style={{ color: "var(--ink-soft)" }}>New on Hub — no reviews yet</span>}
          </div>
        </div>
        {(() => {
          const t = todayHours(clinic);
          return t && !t.closed
            ? <span className="open-pill"><span className="dot"></span>Open today · {t.open} – {t.close}</span>
            : <span className="open-pill" style={{ opacity: 0.75 }}><span className="dot" style={{ background: "#B06A5B" }}></span>Closed today</span>;
        })()}
      </div>

      <div className="detail-grid">
        <div>
          <div className="panel reveal">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 10v7" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round" /></svg>
              About this clinic
            </h2>
            <p>{clinic.about || "This clinic hasn't written its story yet — its verified services and prices are listed below."}</p>
            <div className="amenities" style={{ marginTop: "20px" }}>
              {(clinic.amenities || []).map((a) => (
                <span className="amenity" key={a}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {a}
                </span>
              ))}
              <span className="amenity">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.7" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" /></svg>
                Free cancellation · 12h
              </span>
            </div>
          </div>

          <div className="panel reveal">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M9.5 14a2.5 2.5 0 0 0 5 0" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round" /></svg>
              Treatments &amp; prices
            </h2>
            {services.map((s) => (
              <div className="service" key={s.name}>
                <div className="info"><strong>{s.name}</strong><span>{s.mins} min</span></div>
                <div className="right">
                  <span className="price">{money(s.price)}</span>
                  <a className="btn btn-ghost" href="#book" onClick={(e) => { e.preventDefault(); setService(s.name); document.getElementById("book").scrollIntoView({ behavior: "smooth" }); }}>Select</a>
                </div>
              </div>
            ))}
          </div>

          <div className="panel reveal">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" stroke="#6E9A82" strokeWidth="1.8" strokeLinejoin="round" /></svg>
              Patient reviews
            </h2>
            {reviews.length === 0 ? (
              <p>No reviews yet — reviews from completed bookings appear here.</p>
            ) : (
              reviews.map((rv) => (
                <div className="service" key={rv._id}>
                  <div className="info">
                    <strong>{rv.user ? rv.user.name : "Patient"} · {"💧".repeat(rv.rating)}</strong>
                    <span>{rv.text || "No comment left."}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="info-row">
            <div className="info-card reveal">
              <h3>Opening hours</h3>
              <ul className="hours">
                {(clinic.hours || []).map((hr) => {
                  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  const isToday = hr.d === names[new Date().getDay()];
                  return (
                    <li key={hr.d} className={isToday ? "today" : ""}>
                      <strong>{isToday ? "Today" : hr.d}</strong>
                      <span>{hr.closed ? "Closed" : hr.open + " – " + hr.close}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="info-card reveal d1">
              <h3>Location</h3>
              <p style={{ fontSize: "14.5px", color: "var(--ink-soft)" }}>{clinic.address}</p>
              <div className="map-ph">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 7.2c1.5 2 3 3.2 3 5a3 3 0 1 1-6 0c0-1.8 1.5-3 3-5Z" stroke="#6E9A82" strokeWidth="1.5" /></svg>
                Map preview
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="book-card reveal" id="book">
            <h2>Book an appointment</h2>
            <div className="field">
              <label>Treatment</label>
              <select value={selected ? selected.name : ""} onChange={(e) => setService(e.target.value)}>
                {services.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} · {money(s.price)}</option>
                ))}
              </select>
            </div>
            <div className="slot-label">Pick a day</div>
            <div className="day-row">
              {days.map((d, i) => {
                const off = closedDays.has(d.label);
                return (
                  <span
                    key={i}
                    className={"day" + (i === dayIdx && !off ? " on" : "")}
                    title={off ? "Closed on " + d.label : undefined}
                    style={off ? { opacity: 0.45, cursor: "not-allowed", position: "relative", textDecoration: "line-through" } : undefined}
                    onClick={() => { if (!off) { setDayIdx(i); setSlotErr(""); } }}
                  >
                    <span>{d.label}</span><strong>{off ? "✕" : d.num}</strong>
                  </span>
                );
              })}
            </div>
            <div className="slot-label" style={{ marginTop: "16px" }}>Available times</div>
            <div className="slot-grid">
              {SLOTS.map((s) => {
                const off = takenTimes.has(s);
                return (
                  <span
                    key={s}
                    className={"slot" + (off ? " off" : slot === s ? " on" : "")}
                    title={off ? "Already booked" : undefined}
                    onClick={() => { if (!off) { setSlot(s); setSlotErr(""); } }}
                  >
                    {off ? <s>{s}</s> : s}
                  </span>
                );
              })}
            </div>
            {slotErr && <div style={{ background: "var(--blush)", color: "#B06A5B", fontSize: "13.5px", fontWeight: 700, borderRadius: "14px", padding: "11px 16px", marginTop: "14px" }}>{slotErr}</div>}
            {clinic.paused ? (
              <div style={{ background: "var(--cream)", border: "1px dashed var(--line)", borderRadius: "14px", padding: "12px 16px", marginTop: "20px", fontSize: "13.5px", color: "var(--ink-soft)", textAlign: "center" }}>
                This clinic has paused new bookings — check back soon.
              </div>
            ) : user && user.role !== "patient" ? (
              <div style={{ background: "var(--cream)", border: "1px dashed var(--line)", borderRadius: "14px", padding: "12px 16px", marginTop: "20px", fontSize: "13.5px", color: "var(--ink-soft)", textAlign: "center" }}>
                You're viewing this page as a {user.role} — only patient accounts can book.
              </div>
            ) : (
              <button className="btn btn-primary" onClick={confirm}>Confirm Booking</button>
            )}
            <div className="reassure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Free cancellation up to 12 hours before
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
