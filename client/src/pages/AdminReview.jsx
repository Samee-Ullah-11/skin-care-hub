import "./adminreview.css";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useReveal } from "../components/useReveal";

const CHECKS = [
  ["License is valid", "Number checked against PMC registry"],
  ["Identity matches", "Owner document matches application"],
  ["Photos look genuine", "Real premises, no stock images"],
  ["Phone verified", "Owner reachable on the listed number"]
];

export default function AdminReview() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [checks, setChecks] = useState([true, true, false, false]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/applications").then((d) => {
      setApp(d.applications.find((a) => a._id === id) || null);
    }).catch(() => setApp(null));
  }, [id]);
  useReveal([app]);

  if (app === null) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center", color: "var(--ink-soft)" }}>
        Loading application… if nothing appears, <Link to="/admin" style={{ color: "var(--forest)" }}>go back to the queue</Link>.
      </div>
    );
  }

  const allChecked = checks.every(Boolean);
  const decided = app.status !== "pending";

  async function decide(approve) {
    setBusy(true);
    try {
      const d = await api("/applications/" + app._id, {
        method: "PATCH",
        body: { status: approve ? "approved" : "rejected", adminNote: note }
      });
      setApp(d.application);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/admin">Admin</Link><span className="sep">·</span>
        <Link to="/admin">Verification queue</Link><span className="sep">·</span>
        <span className="here">{app.clinic}</span>
      </nav>

      {app.status === "approved" && (
        <div className="banner ok show">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#2F4A3C" strokeWidth="1.8" /><path d="M9.2 13.4l2 2 3.8-3.9" stroke="#2F4A3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Approved — the clinic is now live on the Hub, and the owner has been notified.
        </div>
      )}
      {app.status === "rejected" && (
        <div className="banner no show">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 3-7 6-11Z" stroke="#B06A5B" strokeWidth="1.8" /><path d="M9.5 10.5l5 5M14.5 10.5l-5 5" stroke="#B06A5B" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Rejected — the owner receives the reason and can re-apply once it's fixed.
        </div>
      )}

      <div className="rev-head reveal">
        <div>
          <span className="q-tag">{decided ? (app.status === "approved" ? "Approved application" : "Rejected application") : "New clinic application"}</span>
          <h1>{app.clinic}</h1>
          <div className="meta">
            {app.area}, Peshawar · Applied {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="rev-grid">
        <div>
          <div className="panel reveal">
            <h2>Application details</h2>
            <div className="kv">
              <div className="row"><span className="k">Clinic name</span><span className="v">{app.clinic}</span></div>
              <div className="row"><span className="k">Owner / manager</span><span className="v">{app.owner}</span></div>
              <div className="row"><span className="k">Owner email</span><span className="v">{app.email || "—"}</span></div>
              <div className="row"><span className="k">Phone</span><span className="v">{app.phone}</span></div>
              <div className="row"><span className="k">Address</span><span className="v">{app.address}</span></div>
              <div className="row"><span className="k">Services</span><span className="v">{(app.services || []).join(" · ") || "—"}</span></div>
              <div className="row"><span className="k">PMC license</span><span className="v">{app.license}</span></div>
              <div className="row"><span className="k">Owner note</span><span className="v">{app.note || "—"}</span></div>
            </div>
          </div>

          <div className="panel reveal">
            <h2>Documents</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
              Document and photo uploads aren't part of the application form yet — verify the PMC license number against the registry and call the owner on the listed phone number before approving.
            </p>
          </div>
        </div>

        <div className="decide reveal d1">
          <div className="panel">
            <h2>Verification checklist</h2>
            {CHECKS.map(([title, sub], i) => (
              <div key={i} className={"check" + (checks[i] ? " on" : "")} onClick={() => !decided && setChecks((cur) => cur.map((c, j) => (j === i ? !c : c)))}>
                <span className="box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFBF7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span><strong>{title}</strong><span>{sub}</span></span>
              </div>
            ))}

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "var(--forest)", marginBottom: "8px" }}>
                Note to owner (sent on reject)
              </label>
              <textarea placeholder="e.g. License photo is blurry — please re-upload…" value={decided ? (app.adminNote || "") : note} onChange={(e) => setNote(e.target.value)} readOnly={decided}></textarea>
              <button
                className="btn btn-primary"
                disabled={!allChecked || decided || busy}
                style={{ opacity: allChecked && !decided ? 1 : 0.5, cursor: allChecked && !decided ? "pointer" : "not-allowed" }}
                onClick={() => decide(true)}
              >
                Approve &amp; publish
              </button>
              <button className="btn reject" disabled={decided || busy} style={{ opacity: decided ? 0.5 : 1 }} onClick={() => decide(false)}>
                Reject application
              </button>
              <div className="hint3">{decided ? "This application has already been decided." : "Approve unlocks when all four checks pass."}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
