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

  useEffect(() => {
    const loadSubscription =
      async () => {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
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
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Link to="/">
          <img
            src={logo}
            alt="Summarist"
          />
        </Link>
      </div>

      <nav className="sidebar__nav">
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

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">
            ★
          </span>

          <span>Highlights</span>
        </button>

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">
            ⌕
          </span>

          <span>Search</span>
        </button>

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

        <button
          type="button"
          className="sidebar__link sidebar__link--disabled"
          disabled
        >
          <span className="sidebar__icon">
            ?
          </span>

          <span>
            Help &amp; Support
          </span>
        </button>
      </nav>

      <div className="sidebar__bottom">
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
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent(
                  "open-auth-modal"
                )
              );
            }}
          >
            Log in
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;