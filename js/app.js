/* ============================================================
   Skin Care Hub — shared page wiring (nav auth state, credits)
   Runs on every page after store.js.
   ============================================================ */
(function () {
  if (!window.SCH) return;
  const u = SCH.user();

  // highlight the nav link for the current page
  const here = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
    const href = (a.getAttribute("href") || "").split("#")[0];
    if (href === here && !a.classList.contains("btn")) a.classList.add("active");
  });

  // credits pill: show real total for signed-in patients
  document.querySelectorAll(".nav-credits").forEach(function (el) {
    if (u && u.role === "patient") {
      el.style.display = "inline-flex";
      const b = el.querySelector("b");
      if (b) b.textContent = u.credits || 0;
    } else {
      el.style.display = "none";
    }
  });

  // swap "Sign in" links for the signed-in destination
  if (u) {
    const dest = u.role === "clinic" ? "dashboard.html" : u.role === "admin" ? "admin.html" : "bookings.html";
    const label = u.role === "clinic" ? "Dashboard" : u.role === "admin" ? "Admin" : "My bookings";
    document.querySelectorAll('a[href="login.html"]').forEach(function (a) {
      if (/Sign in/i.test(a.textContent)) { a.textContent = label; a.href = dest; }
    });
  }
})();
