import { Link } from "react-router-dom";
import { Drop } from "./Brand";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <span className="brand">
              <Drop color="#C9A27E" />
              Skin Care Hub
            </span>
            <p>A calm place to find and book trusted skin care and aesthetic clinics in Peshawar.</p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li><Link to="/clinics">Clinics</Link></li>
              <li><Link to="/#treatments">Treatments</Link></li>
              <li><Link to="/#how">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h5>For clinics</h5>
            <ul>
              <li><Link to="/join">List your clinic</Link></li>
              <li><Link to="/dashboard">Clinic dashboard</Link></li>
              <li><Link to="/join">Verification</Link></li>
            </ul>
          </div>
          <div>
            <h5>Support</h5>
            <ul>
              <li><a href="#top">Help centre</a></li>
              <li><a href="#top">Contact us</a></li>
              <li><a href="#top">Privacy policy</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bar">
          <span>© 2026 Skin Care Hub</span>
          <span>Peshawar, Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
