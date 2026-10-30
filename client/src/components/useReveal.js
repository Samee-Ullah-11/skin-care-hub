import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Replays the design's scroll-reveal animation on every route change.
export function useReveal(deps = []) {
  const { pathname } = useLocation();
  useEffect(() => {
    let pending = [...document.querySelectorAll(".reveal:not(.in)")];
    function sweep() {
      const vh = window.innerHeight;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < vh * 0.92) {
          el.classList.add("in");
          return false;
        }
        return true;
      });
    }
    const onScroll = () => requestAnimationFrame(sweep);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sweep);
    const t = setTimeout(sweep, 50);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sweep);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, ...deps]);
}
