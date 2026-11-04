import "./login.css";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth, destFor } from "../auth";
import Brand, { Drop } from "../components/Brand";
import { useReveal } from "../components/useReveal";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useReveal();

  const next = new URLSearchParams(location.search).get("next");
  const [mode, setMode] = useState(location.hash === "#signup" ? "up" : "in");
  const [view, setView] = useState("form"); // form | done
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneName, setDoneName] = useState("");

  const [form, setForm] = useState({ email: "", pass: "", upName: "", upEmail: "", upPass: "", upPhone: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function finish(data) {
    signIn(data.token, data.user);
    navigate(destFor(data.user, next));
  }

  async function primary() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "up") {
        const d = await api("/auth/signup", { method: "POST", body: { name: form.upName, email: form.upEmail, password: form.upPass, phone: form.upPhone } });
        signIn(d.token, d.user);
        setDoneName(d.user.name.split(" ")[0]);
        setView("done");
        window.scrollTo(0, 0);
      } else {
        const d = await api("/auth/login", { method: "POST", body: { email: form.email, password: form.pass } });
        finish(d);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { setErr(""); }, [mode]);

  const isIn = mode === "in";

  return (
    <>
      <div className="auth-bar">
        <Brand />
        <Link className="back" to="/">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to home
        </Link>
      </div>

      <main className="auth-main">
        <div className="auth-grid">
          <div className="auth-visual reveal in">
            <div className="veil"></div>
            <span className="pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.7" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Verified clinics only
            </span>
            <div className="caption">
              <span className="mark">
                <Drop size={20} color="#FFFBF7" />
                Skin Care Hub
              </span>
              <p>Book your next treatment in minutes — and walk in relaxed.</p>
            </div>
          </div>

          <div className="auth-card reveal in d1">
            {view === "form" && (
              <div>
                <h1>{isIn ? "Welcome back" : "Create your account"}</h1>
                <p className="sub">
                  {isIn
                    ? "Sign in with your email and password."
                    : "Your name, email and password — plus your number for booking SMS."}
                </p>

                <div className="tabs">
                  <span className={"tab" + (isIn ? " on" : "")} onClick={() => setMode("in")}>Sign in</span>
                  <span className={"tab" + (!isIn ? " on" : "")} onClick={() => setMode("up")}>Create account</span>
                </div>

                {isIn ? (
                  <div>
                    <div className="field">
                      <label>Email</label>
                      <input type="text" placeholder="you@example.com" value={form.email} onChange={set("email")} />
                    </div>
                    <div className="field">
                      <label>Password</label>
                      <input type="password" placeholder="••••••••" value={form.pass} onChange={set("pass")} onKeyDown={(e) => e.key === "Enter" && primary()} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="two-col">
                      <div className="field">
                        <label>Full name</label>
                        <input type="text" placeholder="Your full name" value={form.upName} onChange={set("upName")} />
                      </div>
                      <div className="field">
                        <label>Email</label>
                        <input type="text" placeholder="you@example.com" value={form.upEmail} onChange={set("upEmail")} />
                      </div>
                      <div className="field">
                        <label>Password</label>
                        <input type="password" placeholder="At least 8 characters" value={form.upPass} onChange={set("upPass")} />
                      </div>
                      <div className="field">
                        <label>Phone number</label>
                        <input type="text" placeholder="03XX XXXXXXX" value={form.upPhone} onChange={set("upPhone")} />
                      </div>
                    </div>
                    <div className="hint" style={{ fontSize: "13px", color: "var(--ink-soft)", margin: "-4px 0 10px" }}>
                      Your number is used for booking confirmations by SMS or WhatsApp. New accounts get 200 welcome credits.
                    </div>
                  </div>
                )}

                {err && <div className="auth-err">{err}</div>}

                <button className="btn btn-primary" disabled={busy} onClick={primary}>
                  {busy ? "One moment…" : isIn ? "Sign in" : "Create account"}
                </button>

                <p className="terms">By continuing you agree to the Hub's terms of use and privacy policy.</p>
                <p className="terms" style={{ marginTop: "8px" }}>
                  Run a clinic? <Link to="/join" style={{ color: "var(--forest)", fontWeight: 700 }}>Apply to join the Hub</Link> — your sign-in is created when your clinic is approved.
                </p>
              </div>
            )}

            {view === "done" && (
              <div id="doneView" className="show" style={{ display: "block", textAlign: "center" }}>
                <div className="done-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#6E9A82" strokeWidth="1.8" /><path d="M9.3 13.4l2 2 3.6-4" stroke="#6E9A82" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h1>Your account is ready</h1>
                <p className="sub">
                  Welcome to the Hub, {doneName}. You earn credits every time you book or review — collect 300 and your next booking is 5% off.
                </p>
                <div className="credit-chip">
                  <Drop size={16} color="#C9A27E" filled />
                  +200 welcome credits added
                </div>
                {next ? (
                  <Link className="btn btn-primary" to={next}>Continue your booking</Link>
                ) : (
                  <Link className="btn btn-primary" to="/clinics">Browse clinics &amp; book</Link>
                )}
                <Link className="btn btn-ghost" to="/bookings">Go to my bookings</Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="auth-foot">© 2026 Skin Care Hub · Peshawar, Pakistan</div>
    </>
  );
}
