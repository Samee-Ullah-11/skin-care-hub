import "./clinics.css";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth";
import { useReveal } from "../components/useReveal";

const CHIPS = ["All", "Facials", "Laser", "Acne Care", "Anti-Aging", "Whitening", "Hair & Scalp"];

function Stars({ rating, count }) {
  const full = Math.round(rating);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24">
          <path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" fill={i <= full ? "#C9A27E" : "#EDE2D3"} />
        </svg>
      ))}
      <span className="score">{rating.toFixed(1)}</span>
      <span className="count">({count} review{count === 1 ? "" : "s"})</span>
    </span>
  );
}

export function ClinicCard({ clinic, delay }) {
  const minPrice = Math.min(...(clinic.services || []).filter(s => s.on).map(s => s.price));
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = (clinic.hours || []).find((h) => h.d === names[new Date().getDay()]);
  return (
    <article className={"clinic-card reveal" + (delay ? " d" + delay : "")}>
      <div className="photo">
        <span className="ph-note">Clinic photo</span>
        {clinic.photo && <img className="clinic-img" src={clinic.photo} alt={clinic.name} loading="lazy" onError={(e) => e.currentTarget.remove()} />}
        <div className="badges">
          {clinic.verified && (
            <span className="badge badge-verified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Verified
            </span>
          )}
          {!clinic.ratingCount && (
            <span className="badge badge-new">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#B06A5B" strokeWidth="1.7" /></svg>
              New on Hub
            </span>
          )}
        </div>
      </div>
      <div className="body">
        <h3>{clinic.name}</h3>
        <div className="loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 7.2c1.5 2 3 3.2 3 5a3 3 0 1 1-6 0c0-1.8 1.5-3 3-5Z" stroke="#6E9A82" strokeWidth="1.5" /></svg>
          {clinic.area}
        </div>
        {clinic.ratingCount > 0 && <Stars rating={clinic.rating} count={clinic.ratingCount} />}
        {today && (
          today.closed
            ? <div className="open-note"><span className="dot" style={{ background: "#B06A5B" }}></span>Closed today</div>
            : <div className="open-note"><span className="dot"></span>Open today · until {today.close}</div>
        )}
        <div className="tags">
          {(clinic.services || []).slice(0, 3).map((s) => (
            <span className="tag" key={s.name}>{s.name}</span>
          ))}
        </div>
        <div className="foot">
          <div className="price">Starting from<strong>{Number.isFinite(minPrice) ? money(minPrice) : "—"}</strong></div>
          <Link className="btn btn-primary" to={"/clinics/" + clinic._id}>Book Now</Link>
        </div>
      </div>
    </article>
  );
}

export default function Clinics() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [area, setArea] = useState("All areas");
  const [budget, setBudget] = useState("Any budget");
  const [chip, setChip] = useState("All");
  const [sort, setSort] = useState("Recommended");

  useEffect(() => {
    api("/clinics").then((d) => setClinics(d.clinics)).catch(() => { setClinics([]); setLoadErr(true); });
  }, []);

  const results = useMemo(() => {
    if (!clinics) return [];
    let list = clinics.filter((c) => {
      const hay = (c.name + " " + c.area + " " + (c.services || []).map(s => s.name).join(" ")).toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (area !== "All areas" && !c.area.toLowerCase().includes(area.toLowerCase())) return false;
      if (chip !== "All" && !hay.includes(chip.toLowerCase().replace(" & scalp", ""))) return false;
      const min = Math.min(...(c.services || []).map(s => s.price));
      if (budget === "Under Rs. 3,000" && min >= 3000) return false;
      if (budget === "Rs. 3,000 – 6,000" && (min < 3000 || min > 6000)) return false;
      if (budget === "Rs. 6,000+" && min < 6000) return false;
      return true;
    });
    if (sort === "Highest rated") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "Lowest price") list = [...list].sort((a, b) =>
      Math.min(...a.services.map(s => s.price)) - Math.min(...b.services.map(s => s.price)));
    return list;
  }, [clinics, q, area, budget, chip, sort]);

  useReveal([clinics, q, area, budget, chip, sort]);

  // Clinic accounts only ever see their own clinic — never the competition.
  if (user && user.role === "clinic") {
    return <Navigate to={user.clinicId ? "/clinics/" + user.clinicId : "/dashboard"} replace />;
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /></svg>
            Browse clinics
          </span>
          <h1>Skin clinics in Peshawar</h1>
          <p>Filter by treatment, area and budget — every clinic is verified before it's listed.</p>

          <div className="filter-bar reveal">
            <div className="filter-row">
              <div className="field search-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4c2.4 3.2 4.8 5.2 4.8 8.8A5.6 5.6 0 0 1 11 18.3" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" /><circle cx="11" cy="12.6" r="5.7" stroke="#6E9A82" strokeWidth="1.8" /><path d="M20 21l-3.6-3.6" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" /></svg>
                <input type="text" placeholder="Search clinic or treatment…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="field">
                <select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option>All areas</option>
                  <option>Hayatabad</option>
                  <option>University Town</option>
                  <option>Saddar</option>
                  <option>Gulbahar</option>
                </select>
              </div>
              <div className="field">
                <select aria-label="Budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
                  <option>Any budget</option>
                  <option>Under Rs. 3,000</option>
                  <option>Rs. 3,000 – 6,000</option>
                  <option>Rs. 6,000+</option>
                </select>
              </div>
            </div>
            <div className="chip-row">
              {CHIPS.map((c) => (
                <span key={c} className={"chip" + (chip === c ? " on" : "")} onClick={() => setChip(c)}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="results">
        <div className="container">
          <div className="results-head reveal">
            <span className="count">
              {clinics === null ? "Loading clinics…" : <><strong>{results.length} clinic{results.length === 1 ? "" : "s"}</strong> found · all verified by the Hub</>}
            </span>
            <label className="sort">Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Recommended</option>
                <option>Highest rated</option>
                <option>Lowest price</option>
              </select>
            </label>
          </div>

          <div className="results-grid">
            {results.map((c, i) => <ClinicCard key={c._id} clinic={c} delay={i % 3} />)}
          </div>

          {clinics !== null && results.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--ink-soft)", padding: "30px 0" }}>
              {loadErr
                ? "We couldn't load the clinics — check your connection and refresh the page."
                : clinics.length === 0
                  ? "No clinics are live on the Hub yet — new clinics appear here as soon as they're verified."
                  : "No clinics match those filters — try clearing the search or picking another area."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
