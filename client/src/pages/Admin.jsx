import "./admin.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";

function BookingsChart({ byDay }) {
  const W = 560, H = 170, pad = 6;
  const max = Math.max(1, ...byDay.map((d) => d.count));
  const bw = (W - pad * 2) / byDay.length;
  return (
    <svg viewBox={"0 0 " + W + " " + (H + 34)} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Bookings per day, last 14 days">
      {byDay.map((d, i) => {
        const bh = Math.max(3, Math.round((d.count / max) * (H - 24)));
        const x = pad + i * bw;
        const today = i === byDay.length - 1;
        const label = new Date(d.date + "T00:00:00").getDate();
        return (
          <g key={d.date}>
            <rect
              x={x + bw * 0.18} y={H - bh} width={bw * 0.64} height={bh} rx={Math.min(7, bw * 0.3)}
              fill={today ? "var(--forest, #2F4A3C)" : "var(--sage, #6E9A82)"} opacity={today ? 1 : 0.55}
            >
              <title>{d.date} · {d.count} booking{d.count === 1 ? "" : "s"}</title>
            </rect>
            {d.count > 0 && (
              <text x={x + bw / 2} y={H - bh - 7} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--forest, #2F4A3C)">{d.count}</text>
            )}
            <text x={x + bw / 2} y={H + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-soft, #7A736B)">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Admin() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState(null);
  const [clinics, setClinics] = useState(null);
  const [users, setUsers] = useState(null);
  const [stats, setStats] = useState(null);

  function load() {
    api("/applications").then((d) => setApps(d.applications)).catch(() => setApps([]));
    api("/admin/clinics").then((d) => setClinics(d.clinics)).catch(() => setClinics([]));
    api("/admin/users").then((d) => setUsers(d.users)).catch(() => setUsers([]));
    api("/admin/stats").then((d) => setStats(d)).catch(() => {});
  }
  useEffect(load, []);
  useReveal([apps, clinics, users, stats]);

  const goTo = (sel) => () => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const list = apps || [];
  const waiting = list.filter((a) => a.status === "pending");
  const dateLine = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  async function toggleBlock(c) {
    const verb = c.blocked ? "Unblock" : "Block";
    if (!window.confirm(verb + " " + c.name + "? " + (c.blocked ? "It becomes visible and bookable again." : "It disappears from the Hub and can't take bookings."))) return;
    try {
      await api("/admin/clinics/" + c._id, { method: "PATCH", body: { blocked: !c.blocked } });
      load();
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function removeClinic(c) {
    if (!window.confirm("Permanently delete " + c.name + "? Its reviews are removed, open bookings are cancelled and the owner's account is deleted. This cannot be undone.")) return;
    try {
      await api("/admin/clinics/" + c._id, { method: "DELETE" });
      load();
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function removeApp(a, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this " + a.status + " application from the queue?")) return;
    try {
      await api("/applications/" + a._id, { method: "DELETE" });
      load();
    } catch (err) {
      window.alert(err.message);
    }
  }

  const weekDelta = stats ? stats.bookingsWeek - stats.bookingsPrevWeek : 0;

  return (
    <div className="container">
      <div className="dash-head reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /></svg>
            Hub operations
          </span>
          <h1>Admin overview</h1>
          <div className="date">{dateLine} · Skin Care Hub, Peshawar</div>
        </div>
        <button className="signout" onClick={() => { signOut(); navigate("/"); }} title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Sign out
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-tile alert reveal" style={{ cursor: "pointer" }} onClick={goTo("#queuePanel")} title="Open the verification queue">
          <div className="lbl">Pending verifications</div>
          <strong>{apps === null ? "…" : waiting.length}</strong>
          <div className="sub">applications waiting for review</div>
          <span className="go">Open queue <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </div>
        <div className="stat-tile reveal d1" style={{ cursor: "pointer" }} onClick={goTo("#clinicPanel")} title="Manage the clinics on the Hub">
          <div className="lbl">Active clinics</div>
          <strong>{stats ? stats.clinics : "…"}</strong>
          <div className="sub">live on the Hub</div>
          <span className="go">Manage clinics <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </div>
        <div className="stat-tile reveal d2" style={{ cursor: "pointer" }} onClick={goTo("#chartPanel")} title="See the bookings chart">
          <div className="lbl">Bookings this week</div>
          <strong>{stats ? stats.bookingsWeek : "…"}</strong>
          <div className="sub">{stats ? (weekDelta === 0 ? "same as last week" : (weekDelta > 0 ? "+" : "") + weekDelta + " vs last week") + " · " + stats.bookingsTotal + " all time" : ""}</div>
          <span className="go">See the chart <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </div>
        <div className="stat-tile reveal d3" style={{ cursor: "pointer" }} onClick={goTo("#userPanel")} title="See registered patients">
          <div className="lbl">Registered patients</div>
          <strong>{stats ? stats.patients : "…"}</strong>
          <div className="sub">patient accounts on the Hub</div>
          <span className="go">See the list <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </div>
      </div>

      <div className="panel reveal" id="chartPanel">
        <h2>Bookings · last 14 days <span className="mini">live from the database</span></h2>
        {stats ? <BookingsChart byDay={stats.byDay} /> : <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>Loading chart…</p>}
      </div>

      <div className="admin-grid">
        <div>
          <div className="panel reveal" id="queuePanel">
            <h2>Verification queue <span className="mini">{apps === null ? "loading…" : waiting.length + " waiting"}</span></h2>
            {apps !== null && list.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "14.5px" }}>
                No applications in the queue — new clinic applications from the Join page land here.
              </p>
            )}
            {list.map((a) => (
              <div
                className="q-row" key={a._id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/admin/review/" + a._id)}
                title="Open this application"
              >
                <span className="avatar">{(a.clinic || "?").charAt(0).toUpperCase()}</span>
                <span className="who">
                  <strong>{a.clinic}</strong>
                  <span>{a.area} · {a.owner}{a.email ? " · " + a.email : ""}</span>
                </span>
                {a.status === "pending" ? (
                  <span className="q-tag new">New clinic</span>
                ) : a.status === "approved" ? (
                  <span className="q-tag" style={{ background: "rgba(110,154,130,0.14)", color: "var(--forest)" }}>Approved</span>
                ) : (
                  <span className="q-tag" style={{ background: "var(--blush)", color: "#B06A5B" }}>Rejected</span>
                )}
                <span style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <Link className={"btn " + (a.status === "pending" ? "btn-primary" : "btn-ghost")} to={"/admin/review/" + a._id}>
                    {a.status === "pending" ? "Review" : "View"}
                  </Link>
                  {a.status !== "pending" && (
                    <button className="btn btn-ghost" style={{ color: "#B06A5B", animation: "none" }} onClick={(e) => removeApp(a, e)}>Delete</button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="panel reveal" id="clinicPanel">
            <h2>Clinics on the Hub <span className="mini">{clinics === null ? "loading…" : clinics.length + " total"}</span></h2>
            {clinics !== null && clinics.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "14.5px" }}>
                No clinics yet — approve an application and it appears here.
              </p>
            )}
            {(clinics || []).map((c) => (
              <div
                className="q-row" key={c._id}
                style={{ cursor: "pointer", opacity: c.blocked ? 0.65 : 1 }}
                onClick={() => navigate("/clinics/" + c._id)}
                title="Open the clinic's public page"
              >
                <span className="avatar">{(c.name || "?").charAt(0).toUpperCase()}</span>
                <span className="who">
                  <strong>{c.name}</strong>
                  <span>
                    {c.area || "—"}{c.ownerEmail ? " · " + c.ownerEmail : ""} · {c.ratingCount > 0 ? c.rating.toFixed(1) + " ★ (" + c.ratingCount + ")" : "no reviews yet"}
                  </span>
                </span>
                {c.blocked ? (
                  <span className="q-tag" style={{ background: "var(--blush)", color: "#B06A5B" }}>Blocked</span>
                ) : c.paused ? (
                  <span className="q-tag" style={{ background: "rgba(201,162,126,0.18)", color: "#9A7449" }}>Paused by owner</span>
                ) : (
                  <span className="q-tag" style={{ background: "rgba(110,154,130,0.14)", color: "var(--forest)" }}>Live</span>
                )}
                <span style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost" style={{ animation: "none" }} onClick={() => toggleBlock(c)}>{c.blocked ? "Unblock" : "Block"}</button>
                  <button className="btn btn-ghost" style={{ color: "#B06A5B", animation: "none" }} onClick={() => removeClinic(c)}>Delete</button>
                </span>
              </div>
            ))}
          </div>

          <div className="panel reveal" id="userPanel">
            <h2>Registered patients <span className="mini">{users === null ? "loading…" : users.length + " total"}</span></h2>
            {users !== null && users.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "14.5px" }}>
                No patient accounts yet — everyone who signs up on the website appears here.
              </p>
            )}
            {(users || []).map((u) => (
              <div className="q-row" key={u._id}>
                <span className="avatar">{(u.name || "?").charAt(0).toUpperCase()}</span>
                <span className="who">
                  <strong>{u.name}</strong>
                  <span>{u.email || u.phone || "—"} · {u.bookings} booking{u.bookings === 1 ? "" : "s"} · {u.credits} credits</span>
                </span>
                <span className="q-tag" style={{ background: "rgba(110,154,130,0.14)", color: "var(--forest)" }}>
                  Joined {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="panel reveal d1">
            <h2>Recent activity</h2>
            {list.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "14.5px" }}>Activity from clinic applications shows here.</p>
            )}
            <div className="feed">
              {list.slice(0, 6).map((a) => (
                <div className="f-item" key={a._id} style={{ cursor: "pointer" }} onClick={() => navigate("/admin/review/" + a._id)}>
                  <span className="ic">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.7" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" /></svg>
                  </span>
                  <span>
                    <strong>{a.clinic}</strong>{" "}
                    {a.status === "pending" ? "submitted a new application." : a.status === "approved" ? "was approved and is now live." : "was rejected with a note to the owner."}
                    <span className="t">{new Date(a.updatedAt || a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
