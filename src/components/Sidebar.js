import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Link to="/">
          <img src={logo} alt="Summarist" />
        </Link>
      </div>

      <nav className="sidebar__nav">
        <Link
          to="/for-you"
          className={`sidebar__link ${
            isActive("/for-you") ? "sidebar__link--active" : ""
          }`}
        >
          <span className="sidebar__icon">⌂</span>
          <span>For you</span>
        </Link>

        <Link
          to="/library"
          className={`sidebar__link ${
            isActive("/library") ? "sidebar__link--active" : ""
          }`}
        >
          <span className="sidebar__icon">▣</span>
          <span>Library</span>
        </Link>

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">★</span>
          <span>Highlights</span>
        </button>

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">⌕</span>
          <span>Search</span>
        </button>

        <Link
          to="/settings"
          className={`sidebar__link ${
            isActive("/settings") ? "sidebar__link--active" : ""
          }`}
        >
          <span className="sidebar__icon">⚙</span>
          <span>Settings</span>
        </Link>

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">?</span>
          <span>Help & Support</span>
        </button>
      </nav>

      <div className="sidebar__bottom">
        {currentUser ? (
          <button
            type="button"
            className="sidebar__login"
            onClick={handleLogout}
          >
            Log out
          </button>
        ) : (
          <Link to="/settings" className="sidebar__login">
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;