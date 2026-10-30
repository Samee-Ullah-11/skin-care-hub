import "./services.css";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { api, money } from "../api";
import { useReveal } from "../components/useReveal";

const TIME_OPTIONS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
];

function SubNav() {
  return (
    <div className="sub-nav">
      <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? "on" : "")}>Overview</NavLink>
      <NavLink to="/dashboard/services" className={({ isActive }) => (isActive ? "on" : "")}><span className="l-full">Services &amp; schedule</span><span className="l-short">Services</span></NavLink>
      <NavLink to="/dashboard/profile" className={({ isActive }) => (isActive ? "on" : "")}><span className="l-full">Clinic profile</span><span className="l-short">Profile</span></NavLink>
    </div>
  );
}

export default function Services() {
  const [clinic, setClinic] = useState(null);
  const [services, setServices] = useState([]);
  const [hours, setHours] = useState([]);
  const [editing, setEditing] = useState(null); // index being edited
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef();

  useEffect(() => {
    api("/me/clinic")
      .then((d) => {
        setClinic(d.clinic);
        setServices((d.clinic.services || []).map((s) => ({ name: s.name, mins: s.mins, price: s.price, on: s.on })));
        setHours((d.clinic.hours || []).map((h) => ({ d: h.d, open: h.open, close: h.close, closed: h.closed })));
      })
      .catch((e) => setErr(e.message));
  }, []);
  useReveal([clinic]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  const setSvc = (i, k, v) => setServices((cur) => cur.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const setHour = (i, k, v) => setHours((cur) => cur.map((h, j) => (j === i ? { ...h, [k]: v } : h)));

  function addService() {
    setServices((cur) => [...cur, { name: "", mins: 30, price: 3000, on: true }]);
    setEditing(services.length);
  }

  function removeService(i) {
    if (!window.confirm("Remove this service from your list?")) return;
    setServices((cur) => cur.filter((_, j) => j !== i));
    setEditing(null);
  }

  async function save() {
    setErr("");
    setBusy(true);
    try {
      const d = await api("/me/clinic", { method: "PATCH", body: { services, hours } });
      setClinic(d.clinic);
      setServices((d.clinic.services || []).map((s) => ({ name: s.name, mins: s.mins, price: s.price, on: s.on })));
      setEditing(null);
      showToast("Changes saved — patients see them right away");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!clinic && !err) {
    return <div className="container" style={{ padding: "80px 24px", textAlign: "center", color: "var(--ink-soft)" }}>Loading your services…</div>;
  }
  if (!clinic) {
    return <div className="container" style={{ padding: "80px 24px", textAlign: "center", color: "var(--ink-soft)" }}>{err}</div>;
  }

  return (
    <>
      <div className="container">
        <div className="dash-head reveal">
          <span className="eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /></svg>
            Clinic dashboard
          </span>
          <h1>Services &amp; schedule</h1>
          <div className="date">What patients can book, and when — saved to your live page.</div>
          <SubNav />
        </div>

        <div className="svc-grid">
          {/* LEFT: services */}
          <div>
            <div className="panel reveal">
              <h2>Your services</h2>
              <p className="sub">Switch a service off to hide it from patients without deleting it.</p>

              {services.map((s, i) => (
                <div key={i}>
                  <div className={"svc-row" + (s.on ? "" : " off")}>
                    <span
                      className={"switch" + (s.on ? " on" : "")}
                      role="switch"
                      aria-checked={s.on}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSvc(i, "on", !s.on)}
                    ></span>
                    <span className="info">
                      <strong>{s.name || "New service"}</strong>
                      <span>{s.mins} min{s.on ? "" : " · currently hidden from patients"}</span>
                    </span>
                    <span className="price-tag">{money(Number(s.price) || 0)}</span>
                    <button className="edit" aria-label="Edit" onClick={() => setEditing(editing === i ? null : i)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" stroke="#6E9A82" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                  {editing === i && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", padding: "12px 4px 16px" }}>
                      <label style={{ flex: "2 1 160px", fontSize: "12.5px", fontWeight: 700, color: "var(--forest)" }}>
                        Service name
                        <input type="text" value={s.name} onChange={(e) => setSvc(i, "name", e.target.value)} style={{ width: "100%", marginTop: "5px" }} />
                      </label>
                      <label style={{ flex: "1 1 90px", fontSize: "12.5px", fontWeight: 700, color: "var(--forest)" }}>
                        Minutes
                        <input type="number" min="5" max="300" value={s.mins} onChange={(e) => setSvc(i, "mins", e.target.value)} style={{ width: "100%", marginTop: "5px" }} />
                      </label>
                      <label style={{ flex: "1 1 110px", fontSize: "12.5px", fontWeight: 700, color: "var(--forest)" }}>
                        Price (Rs.)
                        <input type="number" min="0" value={s.price} onChange={(e) => setSvc(i, "price", e.target.value)} style={{ width: "100%", marginTop: "5px" }} />
                      </label>
                      <button className="btn btn-ghost" style={{ color: "#B06A5B", animation: "none" }} onClick={() => removeService(i)}>Remove</button>
                    </div>
                  )}
                </div>
              ))}

              <button className="add-svc" onClick={addService}>+ Add a new service</button>
            </div>
          </div>

          {/* RIGHT: schedule */}
          <div>
            <div className="panel reveal d1">
              <h2>Opening hours</h2>
              <p className="sub">Tap a switch to close a day — shown on your public page.</p>

              {hours.map((h, i) => (
                <div key={h.d} className={"day-row2" + (h.closed ? " closed" : "")}>
                  <span className="d">{h.d}</span>
                  {h.closed ? (
                    <span className="times"><span className="t">Closed</span></span>
                  ) : (
                    <span className="times">
                      <select value={h.open} onChange={(e) => setHour(i, "open", e.target.value)}>
                        {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      –
                      <select value={h.close} onChange={(e) => setHour(i, "close", e.target.value)}>
                        {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </span>
                  )}
                  <span
                    className={"switch" + (h.closed ? "" : " on")}
                    role="switch"
                    aria-checked={!h.closed}
                    style={{ cursor: "pointer" }}
                    onClick={() => setHour(i, "closed", !h.closed)}
                  ></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="save-bar reveal">
          <span>{err ? <span style={{ color: "#B06A5B", fontWeight: 700 }}>{err}</span> : "Changes go live on your public page as soon as you save."}</span>
          <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      <div className={"toast" + (toast ? " show" : "")} id="toast" style={toast ? { opacity: 1, transform: "none" } : undefined}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#FFFBF7" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#FFFBF7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {toast}
      </div>
    </>
  );
}
