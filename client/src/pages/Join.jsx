import "./join.css";
import { useState } from "react";
import { api } from "../api";
import { useReveal } from "../components/useReveal";

const SVC_CHIPS = ["Facials", "Laser", "Acne Care", "Anti-Aging", "Whitening", "PRP / Hair", "Botox & Fillers"];

export default function Join() {
  const [form, setForm] = useState({ clinic: "", owner: "", email: "", password: "", phone: "", area: "Hayatabad", address: "", license: "", note: "" });
  const [services, setServices] = useState(["Facials"]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  useReveal([done]);

  function toggleSvc(s) {
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      await api("/applications", { method: "POST", body: { ...form, services } });
      setDone(true);
      document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* HERO */}
      <section className="join-hero">
        <div className="container">
          <div className="grid">
            <div>
              <span className="eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8"/></svg>
                For clinic owners
              </span>
              <h1>Let patients find you — <em>calmly</em></h1>
              <p className="lead">Put your clinic in front of patients across Peshawar who are actively looking for skin care. You run the treatments; the Hub fills your calendar.</p>
              <div className="cta-row">
                <a className="btn btn-primary" href="#apply">Apply to join</a>
                <a className="btn btn-secondary" href="#benefits">See the benefits</a>
              </div>
              <div className="owner-stats">
                <div className="stat"><strong>0 Rs</strong><span>Listing fee — free to join</span></div>
                <div className="stat"><strong>2 days</strong><span>Typical verification time</span></div>
                <div className="stat"><strong>100%</strong><span>You keep your pricing</span></div>
              </div>
            </div>
            <div className="join-visual">
              <div className="photo">
                <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=80&auto=format&fit=crop" alt="Calm treatment room" />
              </div>
              <div className="join-float">
                <strong>Bookings land in your dashboard</strong>
                <span>accept, decline and mark done</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* BENEFITS */}
      <section className="benefits" id="benefits">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Why join</span>
            <h2>Your clinic, more visible</h2>
            <p>Everything you need to welcome new patients — nothing you don't.</p>
          </div>
          <div className="benefit-grid">
            <div className="benefit reveal">
              <span className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M11 4c2.4 3.2 4.8 5.2 4.8 8.8A5.6 5.6 0 0 1 11 18.3" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11" cy="12.6" r="5.7" stroke="#6E9A82" strokeWidth="1.8"/><path d="M20 21l-3.6-3.6" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/></svg></span>
              <strong>Be discovered</strong>
              <span>Appear when patients search for your treatments and area.</span>
            </div>
            <div className="benefit reveal d1">
              <span className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              <strong>Verified badge</strong>
              <span>Stand out with a trust mark patients recognise and look for.</span>
            </div>
            <div className="benefit reveal d2">
              <span className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="4" stroke="#6E9A82" strokeWidth="1.8"/><path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12.6c1 1.3 2 2.1 2 3.3a2 2 0 1 1-4 0c0-1.2 1-2 2-3.3Z" stroke="#6E9A82" strokeWidth="1.5"/></svg></span>
              <strong>Fewer no-shows</strong>
              <span>Automatic SMS reminders keep your schedule honest.</span>
            </div>
            <div className="benefit reveal d3">
              <span className="ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" stroke="#6E9A82" strokeWidth="1.8" strokeLinejoin="round"/></svg></span>
              <strong>Honest reviews</strong>
              <span>Ratings come only from completed visits — no fake reviews, ever.</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* APPLICATION */}
      <section className="apply" id="apply">
        <div className="container">
          <div className="apply-grid">
      
            <div className="apply-side reveal">
              <span className="eyebrow">Apply</span>
              <h2>Join in three easy steps</h2>
              <p>Fill the form, we verify your license and visit if needed, and your clinic goes live.</p>
              <div className="apply-steps">
                <div className="a-step">
                  <span className="n">1</span>
                  <span><strong>Submit your application</strong><span>Takes about five minutes.</span></span>
                </div>
                <div className="a-step">
                  <span className="n">2</span>
                  <span><strong>We verify your clinic</strong><span>License check — usually within 2 working days.</span></span>
                </div>
                <div className="a-step">
                  <span className="n">3</span>
                  <span><strong>Go live &amp; get bookings</strong><span>Set your services, prices and schedule.</span></span>
                </div>
              </div>
            </div>
      
            <div>
              {!done ? (
              <div className="apply-form reveal d1" id="appForm">
                <h3>Clinic application</h3>
                <div className="form-row">
                  <div className="field">
                    <label>Clinic name</label>
                    <input type="text" placeholder="Your clinic's name" value={form.clinic} onChange={set("clinic")} />
                  </div>
                  <div className="field">
                    <label>Owner / manager name</label>
                    <input type="text" placeholder="e.g. Dr. Sana Khan" value={form.owner} onChange={set("owner")} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Email <span style={{ fontWeight: "400", color: "var(--ink-soft)" }}>(your sign-in once approved)</span></label>
                    <input type="text" placeholder="owner@yourclinic.pk" value={form.email} onChange={set("email")} />
                  </div>
                  <div className="field">
                    <label>Choose a password</label>
                    <input type="password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Phone number</label>
                    <input type="text" placeholder="03XX XXXXXXX" value={form.phone} onChange={set("phone")} />
                  </div>
                  <div className="field">
                    <label>Area</label>
                    <select value={form.area} onChange={set("area")}>
                      <option>Hayatabad</option>
                      <option>University Town</option>
                      <option>Saddar</option>
                      <option>Gulbahar</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Clinic address</label>
                  <input type="text" placeholder="Street, phase, landmark…" value={form.address} onChange={set("address")} />
                </div>
                <div className="field">
                  <label>Services you offer <span style={{ fontWeight: "400", color: "var(--ink-soft)" }}>(tap all that apply)</span></label>
                  <div className="svc-chips">
                    {SVC_CHIPS.map((s) => (
                      <span key={s} className={"svc" + (services.includes(s) ? " on" : "")} onClick={() => toggleSvc(s)}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>PMC / practice license number</label>
                  <input type="text" placeholder="For verification only — never shown publicly" value={form.license} onChange={set("license")} />
                </div>
                <div className="field">
                  <label>License &amp; clinic photos</label>
                  <div className="upload">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M12 16v-5M9.8 12.8L12 10.5l2.2 2.3" stroke="#6E9A82" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <strong>Tap to upload</strong> — license photo and 3+ clinic photos<br />(photo upload coming soon)
                  </div>
                </div>
                <div className="field">
                  <label>Anything else? <span style={{ fontWeight: "400", color: "var(--ink-soft)" }}>(optional)</span></label>
                  <textarea placeholder="Specialities, lady doctors available, opening plans…" value={form.note} onChange={set("note")}></textarea>
                </div>
                {err && <div style={{ background: "var(--blush)", color: "#B06A5B", fontSize: "13.5px", fontWeight: "700", borderRadius: "14px", padding: "11px 16px", marginBottom: "14px" }}>{err}</div>}
                <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit application"}</button>
                <p className="fine">Your application goes to the Hub admin for review. Once approved, sign in with the email and password above to manage your clinic. We only use your license for verification.</p>
              </div>
              ) : (
              <div id="appDone" className="show" style={{ display: "block" }}>
                <div className="success-drop">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8"/><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3>Application received</h3>
                <p>Thanks! Your application is now in the admin review queue. Our team will review your license and call you within 2 working days. Once approved, sign in with the email and password you chose to set up your services and prices.</p>
              </div>
              )}
            </div>
      
          </div>
        </div>
      </section>
    </>
  );
}
