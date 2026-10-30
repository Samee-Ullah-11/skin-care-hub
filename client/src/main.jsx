import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./styles.css";
import { AuthProvider, useAuth } from "./auth";
import Ambient from "./components/Ambient";
import Nav, { RoleNav } from "./components/Nav";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Clinics from "./pages/Clinics";
import Clinic from "./pages/Clinic";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Bookings from "./pages/Bookings";
import Join from "./pages/Join";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import ClinicProfile from "./pages/ClinicProfile";
import Admin from "./pages/Admin";
import AdminReview from "./pages/AdminReview";

// Converted design markup still contains plain <a href="/..."> links;
// route them through the SPA router instead of full page loads.
function LinkInterceptor() {
  const navigate = useNavigate();
  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest && e.target.closest("a");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const href = a.getAttribute("href") || "";
      if (a.target || !href.startsWith("/")) return;
      e.preventDefault();
      navigate(href);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function PublicLayout() {
  // Clinic owners and admins keep their own navbar everywhere, so the
  // nav never changes when they browse the public pages.
  const { user } = useAuth();
  const nav = user && user.role === "clinic" ? <RoleNav kind="clinic" />
    : user && user.role === "admin" ? <RoleNav kind="admin" />
    : <Nav />;
  return (
    <>
      <Ambient />
      {nav}
      <Outlet />
      <Footer />
    </>
  );
}

function RoleLayout({ kind }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || (user.role !== kind && user.role !== "admin")) {
    return <Navigate to={"/login?next=" + (kind === "clinic" ? "/dashboard" : "/admin")} replace />;
  }
  return (
    <>
      <Ambient />
      <RoleNav kind={kind} />
      <Outlet />
      <Footer />
    </>
  );
}

function BareLayout() {
  return (
    <>
      <Ambient />
      <Outlet />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <LinkInterceptor />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/clinics/:id" element={<Clinic />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/join" element={<Join />} />
          </Route>
          <Route element={<RoleLayout kind="clinic" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/services" element={<Services />} />
            <Route path="/dashboard/profile" element={<ClinicProfile />} />
          </Route>
          <Route element={<RoleLayout kind="admin" />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/review/:id" element={<AdminReview />} />
          </Route>
          <Route element={<BareLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
