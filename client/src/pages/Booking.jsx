import "./booking.css";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";

function readPending() {
  try {
    const raw = sessionStorage.getItem("sch-pending");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Booking() {
  const { user, ready, refresh } = useAuth();
  const [pending] = useState(readPending);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [pref, setPref] = useState("No preference");
  const [useCredits, setUseCredits] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.name && !/^Guest/.test(user.name)) setName((n) => n || user.name);
      if (user.phone) setPhone((p) => p || user.phone);
    }
  }, [user]);

  useReveal([done]);

  if (ready && !user) return <Navigate to="/login?next=/booking" replace />;
  if (user && user.role !== "patient") {
    return <Navigate to={user.role === "clinic" ? "/dashboard" : "/admin"} replace />;
  }
  if (!pending && !done) return <Navigate to="/clinics" replace />;

  async function confirm() {
    setErr("");
    if (!name.trim()) { setErr("Please enter your full name."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setErr("Enter a valid phone number (03XX XXXXXXX)."); return; }
    setBusy(true);
    try {
      const d = await api("/bookings", {
        method: "POST",
        body: {
          clinicId: pending.clinicId,
          treatment: pending.treatment,
          price: pending.price,
          mins: pending.mins,
          day: pending.day,
          time: pending.time,
          useCredits,
          patientName: name.trim(),
          patientPhone: phone.trim(),
          pref,
          note: note.trim()
        }
      });
      sessionStorage.removeItem("sch-pending");
      setDone(d.booking);
      refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e.message);
      refresh(); // e.g. the signed-in account changed in another tab
    } finally {
      setBusy(false);
    }
  }

  const check = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFBF7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );

  return (
    <div className="container">
      <div className="book-wrap">
        <div className="steps reveal">
          <span className="step done"><span className="n">{check}</span> Choose treatment</span>
          <span className="bar fill"></span>
          <span className={"step " + (done ? "done" : "now")}><span className="n">{done ? check : "2"}</span> Your details</span>
          <span className={"bar" + (done ? " fill" : "")}></span>
          <span className={"step" + (done ? " now" : "")}><span className="n">3</span> Confirmed</span>
        </div>

        {!done ? (
          <div id="formView">
            <div className="page-title reveal">
              <h1>Almost there</h1>
              <p>Just a few details so the clinic knows who's coming.</p>
            </div>

            <div className="confirm-grid">
              <div className="form-panel reveal">
                <h2>Your details</h2>
                <div className="field">
                  <label>Full name</label>
                  <input type="text" placeholder="e.g. Sana Khan" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Phone number</label>
                  <input type="text" placeholder="03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <div className="hint" style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "6px" }}>
                    The clinic will send your confirmation by SMS or WhatsApp.
                  </div>
                </div>
                <div className="field">
                  <label>Specialist preference</label>
                  <div className="choice-row">
                    {["No preference", "Female specialist"].map((p) => (
                      <label key={p} className={"choice" + (pref === p ? " on" : "")} onClick={() => setPref(p)}>
                        <span className="r"></span>
                        <span>
                          <strong>{p}</strong>
                          <span>{p === "No preference" ? "First available specialist" : "Ladies-only room if available"}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Note for the clinic <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>(optional)</span></label>
                  <textarea placeholder="Allergies, skin concerns, anything the clinic should know…" value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                </div>
                {user && user.credits >= 300 && (
                  <div className="field">
                    <label>Hub credits <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>({user.credits} available)</span></label>
                    <div className="choice-row">
                      <label className={"choice" + (useCredits === 0 ? " on" : "")} onClick={() => setUseCredits(0)}>
                        <span className="r"></span>
                        <span><strong>Keep my credits</strong><span>Save them for later</span></span>
                      </label>
                      <label className={"choice" + (useCredits === 300 ? " on" : "")} onClick={() => setUseCredits(300)}>
                        <span className="r"></span>
                        <span><strong>Use 300 — 5% off</strong><span>Applied to this booking</span></span>
                      </label>
                      {user.credits >= 600 && (
                        <label className={"choice" + (useCredits === 600 ? " on" : "")} onClick={() => setUseCredits(600)}>
                          <span className="r"></span>
                          <span><strong>Use 600 — 10% off</strong><span>Applied to this booking</span></span>
                        </label>
                      )}
                    </div>
                  </div>
                )}
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Payment</label>
                  <div className="choice-row">
                    <label className="choice on">
                      <span className="r"></span>
                      <span><strong>Pay at clinic</strong><span>Cash or card after your visit</span></span>
                    </label>
                    <label className="choice off">
                      <span className="r"></span>
                      <span><strong>Pay online</strong><span>Coming soon</span></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="summary-card reveal d1">
                <h2>Booking summary</h2>
                <div className="clinic-mini">
                  <span className="thumb">
                    {pending.photo && <img src={pending.photo} alt="" onError={(e) => e.currentTarget.remove()} />}
                  </span>
                  <span>
                    <strong>{pending.clinic}</strong>
                    <span>{pending.address}</span>
                  </span>
                </div>
                <div className="sum-row"><span>Treatment</span><strong>{pending.treatment}<Link className="change" to={"/clinics/" + pending.clinicId}>Change</Link></strong></div>
                <div className="sum-row"><span>Date</span><strong>{pending.day}</strong></div>
                <div className="sum-row"><span>Time</span><strong>{pending.time} · {pending.mins} min</strong></div>
                <div className="sum-row"><span>Treatment price</span><strong>{money(pending.price)}</strong></div>
                {useCredits > 0 && (
                  <div className="sum-row">
                    <span>Credits reward ({useCredits === 600 ? 10 : 5}% off)</span>
                    <strong style={{ color: "var(--forest)" }}>− {money(Math.round(pending.price * (useCredits === 600 ? 0.1 : 0.05)))}</strong>
                  </div>
                )}
                <div className="sum-row"><span>Booking fee</span><strong>Free</strong></div>
                <div className="sum-row total"><span>Total at clinic</span><strong>{money(pending.price - (useCredits > 0 ? Math.round(pending.price * (useCredits === 600 ? 0.1 : 0.05)) : 0))}</strong></div>
                {err && <div style={{ background: "var(--blush)", color: "#B06A5B", fontSize: "13.5px", fontWeight: 700, borderRadius: "14px", padding: "11px 16px", marginTop: "16px" }}>{err}</div>}
                <button className="btn btn-primary" disabled={busy} onClick={confirm}>{busy ? "Booking…" : "Confirm Booking"}</button>
                <Link className="btn btn-ghost" to={"/clinics/" + pending.clinicId} style={{ width: "100%", justifyContent: "center", marginTop: "10px", animation: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  &nbsp;Back — change treatment or time
                </Link>
                <div className="reassure">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Free cancellation up to 12 hours before
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="successView" className="show" style={{ display: "block" }}>
            <div className="success-drop">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h1>Booking placed</h1>
            <p>Your request has been sent to the clinic. You'll see it as confirmed in My bookings once the clinic accepts — then just arrive and relax.</p>
            <div className="success-card">
              <div className="ref">Booking · {done.ref}</div>
              <div className="clinic-mini">
                <span className="thumb">
                  {done.clinicPhoto && <img src={done.clinicPhoto} alt="" onError={(e) => e.currentTarget.remove()} />}
                </span>
                <span>
                  <strong>{done.clinicName}</strong>
                  <span>{done.address}</span>
                </span>
              </div>
              <div className="sum-row"><span>Treatment</span><strong>{done.treatment}</strong></div>
              <div className="sum-row"><span>When</span><strong>{done.day} · {done.time}</strong></div>
              {done.discountPct > 0 && (
                <div className="sum-row"><span>Credits reward</span><strong style={{ color: "var(--forest)" }}>{done.discountPct}% off · {done.creditsUsed} credits used</strong></div>
              )}
              <div className="sum-row total"><span>Total at clinic</span><strong>{money(done.price)}</strong></div>
            </div>
            <div className="success-actions">
              <Link className="btn btn-primary" to="/bookings">View my bookings</Link>
              <Link className="btn btn-secondary" to="/">Back to home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
