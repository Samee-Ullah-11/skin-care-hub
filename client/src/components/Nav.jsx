import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import Brand, { Drop } from "./Brand";

function CreditsPill({ user }) {
  if (!user || user.role !== "patient") return null;
  return (
    <Link className="nav-credits" to="/bookings" title="Your Hub credits">
      <Drop size={15} color="#C9A27E" filled />
      <b>{user.credits}</b>&nbsp;credits
    </Link>
  );
}

export default function Nav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const accountTo = !user ? "/login" : user.role === "clinic" ? "/dashboard" : user.role === "admin" ? "/admin" : "/bookings";
  const accountLabel = !user ? "Sign in" : user.role === "clinic" ? "Dashboard" : user.role === "admin" ? "Admin" : "My bookings";

  const links = (
    <>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/clinics">Clinics</NavLink>
      <Link to="/#treatments">Treatments</Link>
      <Link to="/#how">How it works</Link>
      <NavLink to={accountTo}>{accountLabel}</NavLink>
    </>
  );

  return (
    <div className="site-nav-wrap">
      <nav className="site-nav">
        <Brand />
        <ul className="nav-links">
          {links.props.children.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        <CreditsPill user={user} />
        <Link className="btn btn-primary" to="/clinics" style={{ padding: "12px 26px", fontSize: "15px" }}>
          Book Appointment
        </Link>
        <button className={"burger" + (open ? " open" : "")} aria-label="Open menu" onClick={() => setOpen(!open)}>
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div className={"mobile-menu" + (open ? " open" : "")} onClick={() => setOpen(false)}>
        {links}
        <Link className="btn btn-primary" to="/clinics">Book Appointment</Link>
      </div>
    </div>
  );
}

export function RoleNav({ kind }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const publicSite = kind === "clinic" && user && user.clinicId ? "/clinics/" + user.clinicId : "/clinics";
  const roleHome = kind === "clinic" ? "/dashboard" : "/admin";

  const links = kind === "clinic" ? (
    <>
      <NavLink to="/dashboard" end>Dashboard</NavLink>
      <NavLink to="/dashboard/services">Services</NavLink>
      <NavLink to="/dashboard/profile">Profile</NavLink>
      <Link to={publicSite}>Public site</Link>
    </>
  ) : (
    <>
      <NavLink to="/admin" end>Admin</NavLink>
      <Link to="/clinics">Public site</Link>
    </>
  );

  return (
    <div className="site-nav-wrap">
      <nav className="site-nav">
        <Brand to={roleHome} />
        <ul className="nav-links">
          {links.props.children.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
        {kind === "clinic" ? (
          <span className="clinic-chip">
            <span className="avatar" style={{ display: "grid", placeItems: "center", background: "var(--sage, #6E9A82)", color: "#FFFBF7", fontWeight: 800 }}>
              {(user && user.name ? user.name : "C").charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{user ? user.name : "Clinic"}</strong>
              <span>● Clinic account</span>
            </span>
          </span>
        ) : (
          <span className="admin-tag">
            <Drop size={12} color="#C9A27E" />
            Admin · {user ? user.name : ""}
          </span>
        )}
        <button className={"burger" + (open ? " open" : "")} aria-label="Open menu" onClick={() => setOpen(!open)}>
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div className={"mobile-menu" + (open ? " open" : "")} onClick={() => setOpen(false)}>
        {links}
      </div>
    </div>
  );
}
