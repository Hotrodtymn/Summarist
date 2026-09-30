import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { getSubscription } from "../utils/subscription";

import logo from "../assets/logo.png";

function Sidebar() {
  const {
    currentUser,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  const [subscription, setSubscription] =
    useState({
      plan: "basic",
      status: "inactive",
    });

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (
        !currentUser ||
        !isAuthenticated
      ) {
        setSubscription({
          plan: "basic",
          status: "inactive",
        });

        return;
      }

      try {
        const userSubscription =
          await getSubscription(
            currentUser.uid
          );

        setSubscription(
          userSubscription || {
            plan: "basic",
            status: "inactive",
          }
        );
      } catch (error) {
        console.error(
          "Failed to load subscription:",
          error
        );

        setSubscription({
          plan: "basic",
          status: "inactive",
        });
      }
    };

    loadSubscription();
  }, [
    currentUser,
    isAuthenticated,
  ]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  };

  const handleOpenAuth = () => {
    setIsMobileMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent("open-auth-modal")
    );
  };

  const isPremium =
    isAuthenticated &&
    subscription.plan === "premium" &&
    (
      subscription.status ===
        "trialing" ||
      subscription.status ===
        "active"
    );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        className={`sidebar__mobile-toggle ${
          isMobileMenuOpen
            ? "sidebar__mobile-toggle--open"
            : ""
        }`}
        onClick={() =>
          setIsMobileMenuOpen(
            !isMobileMenuOpen
          )
        }
        aria-label={
          isMobileMenuOpen
            ? "Close menu"
            : "Open menu"
        }
        aria-expanded={isMobileMenuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="sidebar__overlay"
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          isMobileMenuOpen
            ? "sidebar--mobile-open"
            : ""
        }`}
      >
        {/* Logo */}
        <div className="sidebar__logo">
          <Link to="/">
            <img
              src={logo}
              alt="Summarist"
            />
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar__mobile-close"
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {/* For You */}
          <Link
            to="/for-you"
            className={`sidebar__link ${
              location.pathname ===
              "/for-you"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ⌂
            </span>

            <span>For you</span>
          </Link>

          {/* Library */}
          <Link
            to="/library"
            className={`sidebar__link ${
              location.pathname ===
              "/library"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ▣
            </span>

            <span>Library</span>
          </Link>

          {/* Highlights */}
          <Link
            to="/highlights"
            className={`sidebar__link ${
              location.pathname ===
              "/highlights"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ★
            </span>

            <span>Highlights</span>
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`sidebar__link ${
              location.pathname ===
              "/search"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ⌕
            </span>

            <span>Search</span>
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            className={`sidebar__link ${
              location.pathname ===
              "/settings"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ⚙
            </span>

            <span>Settings</span>
          </Link>

          {/* Help */}
          <Link
            to="/help"
            className={`sidebar__link ${
              location.pathname ===
              "/help"
                ? "sidebar__link--active"
                : ""
            }`}
          >
            <span className="sidebar__icon">
              ?
            </span>

            <span>
              Help &amp; Support
            </span>
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar__bottom">
          {/* Subscription */}
          {isAuthenticated && (
            <Link
              to={
                isPremium
                  ? "/settings"
                  : "/choose-plan"
              }
              className="sidebar__subscription"
            >
              <span className="sidebar__subscription-label">
                {isPremium
                  ? "Premium"
                  : "Basic"}
              </span>

              <span className="sidebar__subscription-action">
                {isPremium
                  ? "Manage plan"
                  : "Upgrade"}
              </span>
            </Link>
          )}

          {/* Login / Logout */}
          {isAuthenticated ? (
            <button
              type="button"
              className="sidebar__login"
              onClick={handleLogout}
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              className="sidebar__login"
              onClick={handleOpenAuth}
            >
              Log in
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;