import "./bookings.css";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth";
import { Drop } from "../components/Brand";
import { useReveal } from "../components/useReveal";

const STATUS_LABEL = {
  confirmed: ["confirmed", "Confirmed"],
  pending: ["pending", "Awaiting clinic"],
  completed: ["completed", "Completed"],
  cancelled: ["cancelled", "Cancelled"]
};

const CAL = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.7" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" /></svg>
);

function ReviewBox({ booking, onDone }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    try {
      await api("/reviews", { method: "POST", body: { bookingId: booking._id, rating: rating || 5, text } });
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="review-box open">
      <h4>How was your visit?</h4>
      <div className="hint">Your review is shown publicly on the clinic's page.</div>
      <div className="rate-drops">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= rating ? "lit" : ""} onClick={() => setRating(n)} aria-label={n + " drops"}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" strokeWidth="1.8" /></svg>
          </button>
        ))}
      </div>
      <textarea placeholder="Tell others what the visit was like — the clinic, the specialist, the results…" value={text} onChange={(e) => setText(e.target.value)}></textarea>
      {err && <div style={{ color: "#B06A5B", fontSize: "13px", fontWeight: 700, marginTop: "8px" }}>{err}</div>}
      <div className="row">
        <button className="btn btn-primary" onClick={submit}>Submit review</button>
        <button className="btn btn-ghost" onClick={() => onDone(false)}>Cancel</button>
      </div>
    </div>
  );
}

function BookingCard({ booking, reviewed, onCancel, onReviewed }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const isPast = booking.status === "completed" || booking.status === "cancelled";
  const [cls, label] = STATUS_LABEL[booking.status] || ["pending", booking.status];

  return (
    <article className="bk-card reveal in">
      <span className="thumb">
        {booking.clinicPhoto && <img src={booking.clinicPhoto} alt="" onError={(e) => e.currentTarget.remove()} />}
      </span>
      <div className="mid">
        <h3>{booking.clinicName}</h3>
        <div className="treat">{booking.treatment} · {booking.mins} min · {booking.ref}</div>
        <span className="when">{CAL}{booking.day || "—"} · {booking.time || "—"}</span>
        <div className="actions">
          {!isPast ? (
            <>
              <Link className="btn btn-ghost" to={"/clinics/" + booking.clinic}>Reschedule</Link>
              <button className="danger" onClick={() => onCancel(booking)}>Cancel</button>
            </>
          ) : (
            <>
              <Link className="btn btn-primary" to={"/clinics/" + booking.clinic} style={{ animation: "none" }}>Book again</Link>
              {booking.status === "completed" && !reviewed && !reviewOpen && (
                <button className="btn btn-ghost" onClick={() => setReviewOpen(true)}>Leave a review</button>
              )}
              {booking.status === "completed" && reviewed && (
                <button className="btn btn-ghost" disabled style={{ opacity: 0.55 }}>Review sent · +20 credits</button>
              )}
            </>
          )}
        </div>
        {reviewOpen && (
          <ReviewBox
            booking={booking}
            onDone={(ok = true) => { setReviewOpen(false); if (ok) onReviewed(); }}
          />
        )}
      </div>
      <div className="side">
        <span className={"status " + cls}><span className="dot"></span>{label}</span>
        <span className="price">{booking.status === "cancelled" ? "—" : money(booking.price)}</span>
      </div>
    </article>
  );
}

export default function Bookings() {
  const { user, ready, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("up");

  async function load() {
    try {
      const [b, r] = await Promise.all([api("/bookings/mine"), api("/reviews/mine")]);
      setBookings(b.bookings);
      setReviews(r.reviews);
    } catch {
      setBookings([]);
    }
  }

  useEffect(() => { if (user) load(); }, [user]);
  useReveal([bookings, tab]);

  if (ready && !user) return <Navigate to="/login?next=/bookings" replace />;
  if (user && user.role !== "patient") {
    return <Navigate to={user.role === "clinic" ? "/dashboard" : "/admin"} replace />;
  }
  if (!user) return null;

  const list = bookings || [];
  const up = list.filter((b) => b.status === "confirmed" || b.status === "pending");
  const past = list.filter((b) => b.status === "completed" || b.status === "cancelled");
  const shown = tab === "up" ? up : past;
  const reviewedIds = new Set(reviews.map((r) => r.booking));

  async function cancel(booking) {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    try {
      await api("/bookings/" + booking._id + "/status", { method: "PATCH", body: { status: "cancelled" } });
      load();
    } catch (e) {
      window.alert(e.message);
    }
  }

  const total = user.credits || 0;
  const nextReward = total < 300 ? 300 : 600;

  return (
    <div className="container">
      <div className="bookings-wrap">
        <div className="page-head reveal">
          <span className="eyebrow">
            <Drop size={14} color="#2F4A3C" />
            Your visits
          </span>
          <h1>{user.name}</h1>
          <p>Everything you've booked through the Hub, in one calm place.</p>
          <div className="profile-chip">
            <span className="avatar">{(user.name || "?").charAt(0).toUpperCase()}</span>
            <span>
              <strong>My bookings</strong>
              <span>{user.phone || user.email}</span>
            </span>
          </div>
          <button className="signout" onClick={() => { signOut(); navigate("/"); }} title="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Sign out
          </button>

          <div className="credits-card reveal d1">
            <div className="cc-score">
              <span className="ring"><Drop size={26} color="#C9A27E" filled /></span>
              <span>
                <strong>{total}</strong>
                <em>Hub credits</em>
              </span>
            </div>
            <div className="cc-mid">
              <div className="cc-row">
                <span>{total >= nextReward ? "Reward unlocked — discount on your next booking" : (nextReward - total) + " credits to your next reward"}</span>
                <strong>5% off at 300 · 10% off at 600</strong>
              </div>
              <div className="cc-bar"><span style={{ width: Math.min(100, Math.round((total / nextReward) * 100)) + "%" }}></span></div>
              <div className="cc-earn">
                <span>+200 welcome bonus</span>
                <span>+50 complete a booking</span>
                <span>+20 leave a review</span>
              </div>
            </div>
          </div>
        </div>

        <div className="seg reveal">
          <span className={"tab" + (tab === "up" ? " on" : "")} onClick={() => setTab("up")}>Upcoming · {up.length}</span>
          <span className={"tab" + (tab === "past" ? " on" : "")} onClick={() => setTab("past")}>Past · {past.length}</span>
        </div>

        <div>
          {bookings === null ? (
            <p style={{ color: "var(--ink-soft)", padding: "20px 0 60px" }}>Loading your bookings…</p>
          ) : shown.length === 0 ? (
            <div className="tip" style={{ marginTop: 0 }}>
              <Drop size={20} color="#2F4A3C" />
              {tab === "up" ? <>No upcoming bookings yet.&nbsp;<Link to="/clinics" style={{ color: "var(--forest)", fontWeight: 800 }}>Browse clinics</Link></> : "Past visits will appear here after your appointments."}
            </div>
          ) : (
            <>
              {shown.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  reviewed={reviewedIds.has(b._id)}
                  onCancel={cancel}
                  onReviewed={() => { load(); refresh(); }}
                />
              ))}
              <div className="tip">
                <Drop size={20} color="#2F4A3C" />
                {tab === "up"
                  ? "Cancelling is free up to 12 hours before your appointment."
                  : "Reviews can only be left after a completed visit."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
