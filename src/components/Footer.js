import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <img src={logo} alt="Summarist" />
          </Link>

          <p>
            Learn more in less time with concise summaries of the world's
            greatest books.
          </p>
        </div>

        <div className="footer__column">
          <h3>Actions</h3>

          <Link to="/for-you">Summarist</Link>
          <Link to="/choose-plan">Pricing</Link>
          <Link to="/settings">Settings</Link>
        </div>

        <div className="footer__column">
          <h3>Help</h3>

          <Link to="/help">Help</Link>
          <a href="mailto:support@summarist.com">Contact us</a>
        </div>

        <div className="footer__column">
          <h3>Useful Links</h3>

          <Link to="/choose-plan">Pricing</Link>
          <span>Summarist Business</span>
          <span>Gift Cards</span>
          <span>Authors &amp; Publishers</span>
        </div>

        <div className="footer__column">
          <h3>Company</h3>

          <span>About</span>
          <span>Careers</span>
          <span>Partners</span>
          <span>Code of Conduct</span>
        </div>

        <div className="footer__column">
          <h3>Other</h3>

          <span>Sitemap</span>
          <span>Legal Notice</span>
          <span>Terms of Service</span>
          <span>Privacy Policies</span>
        </div>
      </div>

      <div className="footer__bottom">
        <p>Copyright © 2026 Summarist. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;