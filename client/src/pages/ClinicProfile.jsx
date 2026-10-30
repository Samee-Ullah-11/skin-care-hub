import "./clinicprofile.css";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { api, money } from "../api";
import { useReveal } from "../components/useReveal";

const AREAS = ["Hayatabad", "University Town", "Saddar", "Gulbahar", "Other"];

// Reads a picked image file and compresses it (max 1000px, JPEG) so it can be
// stored on the clinic document without uploading huge files.
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1000;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file doesn't look like an image.")); };
    img.src = url;
  });
}
const AMENITY_OPTIONS = [
  "PMC-licensed staff",
  "Ladies-only hours",
  "Sterile single-use kits",
  "Parking available",
  "Card payment",
  "Wheelchair access"
];

export default function ClinicProfile() {
  const [clinic, setClinic] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef();
  const fileRef = useRef();

  useEffect(() => {
    api("/me/clinic")
      .then((d) => {
        setClinic(d.clinic);
        setForm({
          name: d.clinic.name || "",
          phone: d.clinic.phone || "",
          about: d.clinic.about || "",
          area: d.clinic.area || "Hayatabad",
          address: d.clinic.address || "",
          photo: d.clinic.photo || "",
          amenities: d.clinic.amenities || [],
          paused: !!d.clinic.paused
        });
      })
      .catch((e) => setErr(e.message));
  }, []);
  useReveal([clinic]);

  if (!form) {
    return <div className="container" style={{ padding: "80px 24px", textAlign: "center", color: "var(--ink-soft)" }}>{err || "Loading your profile…"}</div>;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleAmenity = (a) =>
    setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }));

  async function save() {
    setErr("");
    setBusy(true);
    try {
      const d = await api("/me/clinic", { method: "PATCH", body: form });
      setClinic(d.clinic);
      setToast("Profile saved — your public page is updated");
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 2600);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const onServices = (clinic.services || []).filter((s) => s.on);
  const minPrice = onServices.length ? Math.min(...onServices.map((s) => s.price)) : null;

  return (
    <>
      <div className="container">
        <div className="dash-head reveal">
          <span className="eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /></svg>
            Clinic dashboard
          </span>
          <h1>Clinic profile</h1>
          <div className="date">What patients see on your public page.</div>

          <div className="sub-nav">
            <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? "on" : "")}>Overview</NavLink>
            <NavLink to="/dashboard/services" className={({ isActive }) => (isActive ? "on" : "")}><span className="l-full">Services &amp; schedule</span><span className="l-short">Services</span></NavLink>
            <NavLink to="/dashboard/profile" className={({ isActive }) => (isActive ? "on" : "")}><span className="l-full">Clinic profile</span><span className="l-short">Profile</span></NavLink>
          </div>
        </div>

        <div className="prof-grid">
          {/* LEFT: edit panels */}
          <div>
            <div className="panel reveal">
              <h2>Basics</h2>
              <p className="sub">Your name and story, in your own words.</p>
              <div className="form-row">
                <div className="field">
                  <label>Clinic name</label>
                  <input type="text" value={form.name} onChange={set("name")} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input type="text" placeholder="091 XXXXXXX" value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div className="field">
                <label>About your clinic</label>
                <textarea placeholder="Tell patients what makes your clinic calm, safe and worth visiting…" value={form.about} onChange={set("about")}></textarea>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Area</label>
                  <select value={form.area} onChange={set("area")}>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Address</label>
                  <input type="text" placeholder="Street, phase, landmark…" value={form.address} onChange={set("address")} />
                </div>
              </div>
            </div>

            <div className="panel reveal">
              <h2>Cover photo</h2>
              <p className="sub">Upload a photo of your clinic — bright, real photos get more bookings. Remember to press Save changes after uploading.</p>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileRef}
                onChange={async (e) => {
                  const f = e.target.files && e.target.files[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const dataUrl = await fileToDataUrl(f);
                    setForm((cur) => ({ ...cur, photo: dataUrl }));
                  } catch (ex) {
                    setErr(ex.message);
                  }
                }}
              />
              <div className="photo-grid">
                {form.photo && (
                  <div className="ph-tile">
                    <img src={form.photo} alt="Clinic cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                    <span className="cover-tag">Cover</span>
                    <button className="rm" aria-label="Remove" onClick={() => setForm({ ...form, photo: "" })}>×</button>
                  </div>
                )}
                <div className="ph-add" style={{ cursor: "pointer" }} onClick={() => fileRef.current && fileRef.current.click()}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 16v-5M9.8 12.8L12 10.5l2.2 2.3" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {form.photo ? "Replace photo" : "Upload a photo"}
                </div>
              </div>
            </div>

            <div className="panel reveal">
              <h2>Amenities</h2>
              <p className="sub">Tap to show what your clinic offers — these appear as chips on your page.</p>
              <div className="am-chips">
                {AMENITY_OPTIONS.map((a) => (
                  <span key={a} className={"am" + (form.amenities.includes(a) ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => toggleAmenity(a)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel reveal" id="verifyPanel">
              <h2>Verification</h2>
              <p className="sub">Your license was checked by the Hub admin before your clinic was listed — it is never shown publicly.</p>
              <div className="ver-status">
                {clinic.verified ? (
                  <span className="badge badge-verified">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Verified
                  </span>
                ) : (
                  <span className="badge" style={{ background: "var(--blush)", color: "#B06A5B" }}>Not verified</span>
                )}
                <span className="ver-meta">
                  {clinic.verified
                    ? "Verified on " + new Date(clinic.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "Contact the Hub admin to complete verification."}
                </span>
              </div>
            </div>

            <div className="panel reveal">
              <h2>Visibility</h2>
              <div className="vis-row">
                <span className="lbl2">
                  <strong>Listed on Skin Care Hub</strong>
                  <span>Switch off to pause new bookings — existing ones stay.</span>
                </span>
                <span
                  className={"switch" + (form.paused ? "" : " on")}
                  role="switch"
                  aria-checked={!form.paused}
                  style={{ cursor: "pointer" }}
                  onClick={() => setForm({ ...form, paused: !form.paused })}
                ></span>
              </div>
              {form.paused && (
                <p style={{ fontSize: "13px", color: "#B06A5B", fontWeight: 700, marginTop: "10px" }}>
                  Paused — your clinic is hidden from search and can't receive new bookings until you switch this back on and save.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: live preview */}
          <div>
            <div className="preview-wrap reveal d1">
              <div className="preview-lbl">Live preview · patient view</div>
              <article className="clinic-card">
                <div className="photo">
                  <span className="ph-note">Clinic photo</span>
                  {form.photo && <img className="clinic-img" src={form.photo} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />}
                  <div className="badges">
                    {clinic.verified && (
                      <span className="badge badge-verified">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="body">
                  <h3 id="prevName">{form.name || "Your clinic"}</h3>
                  <div className="loc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M12 7.2c1.5 2 3 3.2 3 5a3 3 0 1 1-6 0c0-1.8 1.5-3 3-5Z" stroke="#6E9A82" strokeWidth="1.5" /></svg>
                    {form.area}
                  </div>
                  <span className="stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" fill={i <= Math.round(clinic.rating) ? "#C9A27E" : "#EDE2D3"} /></svg>
                    ))}
                    {clinic.ratingCount > 0
                      ? <><span className="score">{clinic.rating.toFixed(1)}</span><span className="count">({clinic.ratingCount} review{clinic.ratingCount === 1 ? "" : "s"})</span></>
                      : <span className="count">New on Hub — no reviews yet</span>}
                  </span>
                  <div className="tags">
                    {onServices.slice(0, 3).map((s) => <span className="tag" key={s.name}>{s.name}</span>)}
                  </div>
                  <div className="foot">
                    <div className="price">Starting from<strong>{minPrice !== null ? money(minPrice) : "—"}</strong></div>
                    <span className="btn btn-primary" style={{ animation: "none" }}>Book Now</span>
                  </div>
                </div>
              </article>
              <p className="prev-note">This is how your card appears in search results. <Link to={"/clinics/" + clinic._id}>View full public page →</Link></p>
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
        <span id="toastMsg">{toast}</span>
      </div>
    </>
  );
}
