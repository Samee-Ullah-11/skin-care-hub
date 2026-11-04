import "./dashboard.css";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";

const STATUS_CHIP = {
  confirmed: <span className="status confirmed"><span className="dot"></span>Confirmed</span>,
  completed: <span className="status completed"><span className="dot"></span>Completed</span>,
  cancelled: <span className="status completed"><span className="dot"></span>Cancelled</span>
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loadErr, setLoadErr] = useState(false);

  async function load() {
    try {
      setBookings((await api("/bookings/clinic")).bookings);
      setLoadErr(false);
    } catch {
      setBookings([]);
      setLoadErr(true);
    }
  }
  useEffect(() => {
    load();
    api("/me/clinic").then((d) => setClinic(d.clinic)).catch(() => {});
  }, []);
  useReveal([bookings, clinic]);

  async function setStatus(b, status) {
    if (status === "cancelled" && !window.confirm("Decline this booking?")) return;
    try {
      await api("/bookings/" + b._id + "/status", { method: "PATCH", body: { status } });
      load();
    } catch (e) {
      window.alert(e.message);
    }
  }

  const now = new Date();
  const h = now.getHours();
  const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + (clinic && clinic.area ? " · " + clinic.area : "");

  const all = bookings || [];
  const live = all.filter((b) => b.status !== "cancelled");
  const pendingCount = live.filter((b) => b.status === "pending").length;
  const next = live.find((b) => b.status === "confirmed" || b.status === "pending");

  // Real weekly numbers from booking timestamps.
  const weekCount = all.filter((b) => now - new Date(b.createdAt) < 7 * DAY_MS).length;
  const prevWeekCount = all.filter((b) => {
    const age = now - new Date(b.createdAt);
    return age >= 7 * DAY_MS && age < 14 * DAY_MS;
  }).length;
  const delta = weekCount - prevWeekCount;
  const completed = all.filter((b) => b.status === "completed").length;
  const decided = completed + all.filter((b) => b.status === "cancelled").length;
  const doneRate = decided ? Math.round((completed / decided) * 100) : null;

  // Bookings per day, last 7 days, for the chart.
  const chartDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    const key = d.toDateString();
    chartDays.push({
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      count: all.filter((b) => new Date(b.createdAt).toDateString() === key).length,
      today: i === 0
    });
  }
  const chartMax = Math.max(1, ...chartDays.map((d) => d.count));

  // Profile strength from what's actually filled in.
  const strengthChecks = clinic ? [
    [!!clinic.photo, "a cover photo"],
    [!!clinic.about, "an about text"],
    [!!clinic.phone, "a phone number"],
    [!!clinic.address, "your address"],
    [(clinic.services || []).some((s) => s.on), "at least one active service"],
    [(clinic.amenities || []).length > 0, "your amenities"]
  ] : [];
  const strengthDone = strengthChecks.filter(([ok]) => ok).length;
  const strength = clinic ? Math.round((strengthDone / strengthChecks.length) * 100) : null;
  const missing = strengthChecks.filter(([ok]) => !ok).map(([, label]) => label);

  return (
    <div className="container">
      <div className="dash-head reveal">
        <div className="row">
          <div>
            <span className="eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /></svg>
              Clinic dashboard{clinic ? " · " + clinic.name : ""}
            </span>
            <h1>{hello}</h1>
            <div className="date">{dateLine}</div>
          </div>
          <button className="signout" onClick={() => { signOut(); navigate("/"); }} title="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Sign out
          </button>
        </div>
        <div className="sub-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? "on" : "")}>Overview</NavLink>
          <NavLink to="/dashboard/services"><span className="l-full">Services &amp; schedule</span><span className="l-short">Services</span></NavLink>
          <NavLink to="/dashboard/profile"><span className="l-full">Clinic profile</span><span className="l-short">Profile</span></NavLink>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-tile reveal">
          <div className="lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.7" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" /></svg>
            Hub bookings
          </div>
          <strong>{live.length}</strong>
          <div className="sub">{pendingCount} pending</div>
        </div>
        <div className="stat-tile reveal d1">
          <div className="lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 18c2.5-5 5-8 8-10M12 8c3 2 6 5 8 10" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" /></svg>
            This week
          </div>
          <strong>{weekCount}</strong>
          <div className="sub">{delta === 0 ? "same as last week" : (delta > 0 ? "+" : "") + delta + " vs last week"}</div>
        </div>
        <div className="stat-tile reveal d2">
          <div className="lbl">
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" fill="#C9A27E" /></svg>
            Rating
          </div>
          <strong>{clinic && clinic.ratingCount > 0 ? clinic.rating.toFixed(1) : "New"}</strong>
          <div className="sub">{clinic && clinic.ratingCount > 0 ? "from " + clinic.ratingCount + " review" + (clinic.ratingCount === 1 ? "" : "s") : "no reviews yet"}</div>
        </div>
        <div className="stat-tile reveal d3">
          <div className="lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Completion rate
          </div>
          <strong>{doneRate === null ? "—" : doneRate + "%"}</strong>
          <div className="sub">{doneRate === null ? "no finished visits yet" : "completed vs cancelled"}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="panel reveal">
            <h2>Hub bookings <span className="mini">{bookings === null ? "loading…" : live.length + " total"}</span></h2>
            {bookings !== null && live.length === 0 && (
              <div className="appt"><span className="who"><span>
                {loadErr
                  ? "We couldn't load your bookings — check your connection and refresh the page."
                  : "No Hub bookings yet — bookings made by patients on the website appear here instantly."}
              </span></span></div>
            )}
            {live.map((b) => (
              <div className="appt" key={b._id}>
                <span className="time"><strong>{b.time || "—"}</strong><span>{(b.day || "").slice(0, 11)}</span></span>
                <span className="who">
                  <strong>{b.patientName || "Patient"}</strong>
                  <span>{b.treatment} · {b.mins} min · {money(b.price)} · {b.ref}{b.note ? " · “" + b.note + "”" : ""}</span>
                </span>
                {b.status === "pending" ? (
                  <span className="acts">
                    <button className="btn btn-primary" onClick={() => setStatus(b, "confirmed")}>Accept</button>
                    <button className="decline" onClick={() => setStatus(b, "cancelled")}>Decline</button>
                  </span>
                ) : b.status === "confirmed" ? (
                  <span className="acts">
                    {STATUS_CHIP.confirmed}
                    <button className="btn btn-ghost" style={{ padding: "8px 15px", fontSize: "12.5px", animation: "none" }} onClick={() => setStatus(b, "completed")}>Mark done</button>
                  </span>
                ) : (
                  STATUS_CHIP[b.status]
                )}
              </div>
            ))}
          </div>

          <div className="panel reveal">
            <h2>This week at a glance <span className="mini">bookings per day</span></h2>
            <div className="chart">
              {chartDays.map((d) => (
                <div key={d.label + d.today} className={"bar-col" + (d.today ? " today" : "")}>
                  <div className="bar" style={{ height: Math.round((d.count / chartMax) * 92) + "%" }} title={d.count + " booking" + (d.count === 1 ? "" : "s")}></div>
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="next-card reveal">
            <svg className="drop-deco" width="90" height="90" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#FFFBF7" strokeWidth="1.3" /></svg>
            <div className="lbl">Up next</div>
            <strong>{next ? next.patientName : "No upcoming visit"}</strong>
            <div className="t">{next ? next.treatment + " · " + next.mins + " min" : "New Hub bookings show here"}</div>
            {next && (
              <span className="when">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#FFFBF7" strokeWidth="1.7" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#FFFBF7" strokeWidth="1.7" strokeLinecap="round" /></svg>
                {next.day} · {next.time}
              </span>
            )}
          </div>

          <div className="panel reveal d1">
            <h2>Quick actions</h2>
            <div className="qa-grid">
              <Link className="qa" to="/dashboard/services">
                <span className="ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.8" /><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
                Edit services &amp; slots
              </Link>
              <Link className="qa" to="/dashboard/profile">
                <span className="ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#6E9A82" strokeWidth="2" strokeLinecap="round" /></svg></span>
                Update clinic profile
              </Link>
              <Link className="qa" to={clinic ? "/clinics/" + clinic._id : "/clinics"}>
                <span className="ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 10v7" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
                View public page
              </Link>
            </div>
          </div>

          {clinic && (
            <div className="panel meter-card reveal d2">
              <h2>Profile strength</h2>
              <div className="row2"><span>Completeness</span><strong>{strength}%</strong></div>
              <div className="meter"><div className="fill" style={{ width: strength + "%" }}></div></div>
              <div className="hint2">
                {missing.length === 0
                  ? "Your profile is complete — complete profiles get more bookings."
                  : <>Add {missing.slice(0, 2).join(" and ")} to strengthen your page. <Link to="/dashboard/profile">Edit profile</Link></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
