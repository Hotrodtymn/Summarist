import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import loginImage from "../assets/login.png";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { getSubscriptionStatus } from "../utils/subscription";

function Settings() {
  const { currentUser } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [subscription, setSubscription] = useState("basic");
  const [loadingSubscription, setLoadingSubscription] =
    useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!currentUser) {
        setSubscription("basic");
        setLoadingSubscription(false);
        return;
      }

      setLoadingSubscription(true);

      const plan = await getSubscriptionStatus(
        currentUser.uid
      );

      setSubscription(plan);
      setLoadingSubscription(false);
    };

    loadSubscription();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <main className="settings-page">
        <div className="settings-page__container">
          <div className="settings-page__logged-out">
            <img
              src={loginImage}
              alt="Log in to Summarist"
              className="settings-page__image"
            />

            <h1>Log in to Summarist</h1>

            <p>
              Log in to manage your account and access your
              subscription.
            </p>

            <button
              type="button"
              className="book-page__button"
              onClick={() => setShowAuthModal(true)}
            >
              Log in
            </button>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </main>
    );
  }

  const isPremium =
    subscription === "premium" ||
    subscription === "premium-plus";

  return (
    <main className="settings-page">
      <div className="settings-page__container">
        <div className="settings-page__header">
          <h1>Settings</h1>

          <p>
            Manage your account and subscription.
          </p>
        </div>

        <section className="settings-card">
          <h2>Account</h2>

          <div className="settings-card__row">
            <span>Email</span>

            <strong>{currentUser.email}</strong>
          </div>
        </section>

        <section className="settings-card">
          <h2>Subscription</h2>

          {loadingSubscription ? (
            <div className="settings-card__row">
              <span>Plan</span>

              <strong>Loading...</strong>
            </div>
          ) : (
            <div className="settings-card__subscription">
              <div>
                <h3>
                  {isPremium
                    ? subscription === "premium-plus"
                      ? "Premium Plus"
                      : "Premium"
                    : "Basic"}
                </h3>

                <p>
                  {isPremium
                    ? "You have access to premium Summarist content."
                    : "You currently have a free Summarist account."}
                </p>
              </div>

              {!isPremium && (
                <Link
                  to="/choose-plan"
                  className="book-page__button"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Settings;