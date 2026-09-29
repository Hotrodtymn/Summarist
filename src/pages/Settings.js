import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";

import loginImage from "../assets/login.png";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { getSubscription } from "../utils/subscription";

function Settings() {
  const { currentUser } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [subscription, setSubscription] = useState({
    plan: "basic",
    status: "inactive",
  });
  const [loadingSubscription, setLoadingSubscription] =
    useState(true);
  const [isManagingSubscription, setIsManagingSubscription] =
    useState(false);
  const [subscriptionError, setSubscriptionError] =
    useState("");

  const loadSubscription = useCallback(async () => {
    if (!currentUser) {
      setSubscription({
        plan: "basic",
        status: "inactive",
      });
      setLoadingSubscription(false);
      return;
    }

    setLoadingSubscription(true);
    setSubscriptionError("");

    try {
      const userSubscription = await getSubscription(
        currentUser.uid
      );

      setSubscription(userSubscription);
    } catch (error) {
      console.error(
        "Failed to load subscription:",
        error
      );

      setSubscriptionError(
        "Unable to load your subscription status."
      );
    } finally {
      setLoadingSubscription(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    const handleWindowFocus = () => {
      loadSubscription();
    };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [loadSubscription]);

  const isPremium =
    subscription.plan === "premium" &&
    (
      subscription.status === "trialing" ||
      subscription.status === "active"
    );

  const handleManageSubscription = async () => {
    if (!currentUser || !isPremium) {
      return;
    }

    setSubscriptionError("");
    setIsManagingSubscription(true);

    try {
      const functions = getFunctions();

      const createCustomerPortalSession = httpsCallable(
        functions,
        "createCustomerPortalSession"
      );

      const result = await createCustomerPortalSession();

      const portalUrl = result.data?.url;

      if (!portalUrl) {
        throw new Error(
          "Stripe customer portal URL was not returned."
        );
      }

      window.location.href = portalUrl;
    } catch (error) {
      console.error(
        "Failed to open subscription management:",
        error
      );

      setSubscriptionError(
        "Unable to open subscription management. Please try again."
      );

      setIsManagingSubscription(false);
    }
  };

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
                  {isPremium ? "Premium" : "Basic"}
                </h3>

                <p>
                  {isPremium
                    ? subscription.status === "trialing"
                      ? "Your 7-day Premium trial is active."
                      : "You have an active Premium subscription."
                    : "You currently have a free Summarist account."}
                </p>

                {isPremium && (
                  <p className="settings-card__status">
                    Status: {subscription.status}
                  </p>
                )}
              </div>

              {isPremium ? (
                <button
                  type="button"
                  className="book-page__button"
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                >
                  {isManagingSubscription
                    ? "Opening..."
                    : "Manage Subscription"}
                </button>
              ) : (
                <Link
                  to="/choose-plan"
                  className="book-page__button"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}

          {subscriptionError && (
            <p
              className="plan-card__error"
              role="alert"
            >
              {subscriptionError}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default Settings;