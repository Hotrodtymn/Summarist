import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { signOut } from "firebase/auth";

import loginImage from "../assets/login.png";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { getSubscription } from "../utils/subscription";
import { auth } from "../firebase";

function Settings() {
  const {
    currentUser,
    isAuthenticated,
  } = useAuth();

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const [subscription, setSubscription] =
    useState({
      plan: "basic",
      status: "inactive",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      trialEnd: null,
    });

  const [
    loadingSubscription,
    setLoadingSubscription,
  ] = useState(true);

  const [
    isManagingSubscription,
    setIsManagingSubscription,
  ] = useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [
    subscriptionError,
    setSubscriptionError,
  ] = useState("");

  const loadSubscription =
    useCallback(async () => {
      if (
        !currentUser ||
        !isAuthenticated
      ) {
        setSubscription({
          plan: "basic",
          status: "inactive",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
          trialEnd: null,
        });

        setLoadingSubscription(false);
        return;
      }

      setLoadingSubscription(true);
      setSubscriptionError("");

      try {
        const userSubscription =
          await getSubscription(
            currentUser.uid
          );

        setSubscription({
          plan:
            userSubscription?.plan ||
            "basic",
          status:
            userSubscription?.status ||
            "inactive",
          cancelAtPeriodEnd:
            userSubscription?.cancelAtPeriodEnd ||
            false,
          currentPeriodEnd:
            userSubscription?.currentPeriodEnd ||
            null,
          trialEnd:
            userSubscription?.trialEnd ||
            null,
        });
      } catch (error) {
        console.error(
          "Failed to load subscription:",
          error
        );

        setSubscriptionError(
          "Unable to load your subscription status. Please try again."
        );
      } finally {
        setLoadingSubscription(false);
      }
    }, [
      currentUser,
      isAuthenticated,
    ]);

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

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setIsLoggingOut(false);
    }
  };

  const isPremium =
    subscription.plan === "premium" &&
    (subscription.status === "trialing" ||
      subscription.status === "active");

  const isPremiumPlus =
    subscription.plan ===
      "premium-plus" &&
    (subscription.status === "trialing" ||
      subscription.status === "active");

  const hasPremiumAccess =
    isPremium || isPremiumPlus;

  const isTrialing =
    hasPremiumAccess &&
    subscription.status === "trialing";

  const formatSubscriptionDate = (
    timestamp
  ) => {
    if (!timestamp) {
      return "";
    }

    const date = new Date(
      timestamp * 1000
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const getPlanName = () => {
    if (isPremiumPlus) {
      return "Premium Plus";
    }

    if (isPremium) {
      return "Premium";
    }

    return "Basic";
  };

  const getSubscriptionStatusLabel =
    () => {
      if (
        subscription.cancelAtPeriodEnd
      ) {
        return "Cancellation scheduled";
      }

      if (
        subscription.status ===
        "trialing"
      ) {
        return "Trial active";
      }

      if (
        subscription.status ===
        "active"
      ) {
        return "Active";
      }

      if (
        subscription.status ===
        "past_due"
      ) {
        return "Payment required";
      }

      if (
        subscription.status ===
        "canceled"
      ) {
        return "Canceled";
      }

      return "Inactive";
    };

  const handleManageSubscription =
    async () => {
      if (
        !currentUser ||
        !isAuthenticated ||
        !hasPremiumAccess
      ) {
        return;
      }

      setSubscriptionError("");
      setIsManagingSubscription(true);

      try {
        const functions =
          getFunctions();

        const createCustomerPortalSession =
          httpsCallable(
            functions,
            "createCustomerPortalSession"
          );

        const result =
          await createCustomerPortalSession();

        const portalUrl =
          result.data?.url;

        if (!portalUrl) {
          throw new Error(
            "Stripe customer portal URL was not returned."
          );
        }

        window.location.href =
          portalUrl;
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

  /*
   * Guests and logged-out users should
   * both see the logged-out Settings page.
   */
  if (!isAuthenticated) {
    return (
      <main className="settings-page">
        <div className="settings-page__container">
          <div className="settings-page__logged-out">
            <img
              src={loginImage}
              alt="Log in to Summarist"
              className="settings-page__image"
            />

            <h1>
              Log in to Summarist
            </h1>

            <p>
              Log in to manage your
              account and access your
              subscription.
            </p>

            <button
              type="button"
              className="book-page__button"
              onClick={() =>
                setShowAuthModal(true)
              }
            >
              Log in
            </button>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() =>
              setShowAuthModal(false)
            }
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
            Manage your account and
            subscription.
          </p>
        </div>

        <section className="settings-card">
          <h2>
            Account Information
          </h2>

          <div className="settings-card__row">
            <span>Email</span>

            <strong>
              {currentUser.email ||
                "Not available"}
            </strong>
          </div>

          <div className="settings-card__row">
            <span>Account Status</span>

            <strong>
              Active
            </strong>
          </div>
        </section>

        <section className="settings-card">
          <h2>Subscription</h2>

          {loadingSubscription ? (
            <div
              className="settings-card__subscription"
              aria-live="polite"
            >
              <div className="settings-card__loading">
                <div className="skeleton settings-card__loading-title"></div>

                <div className="skeleton settings-card__loading-text"></div>

                <div className="skeleton settings-card__loading-text settings-card__loading-text--short"></div>
              </div>
            </div>
          ) : (
            <div className="settings-card__subscription">
              <div>
                <h3>
                  {getPlanName()}
                </h3>

                {hasPremiumAccess ? (
                  <>
                    {isTrialing ? (
                      <p>
                        Your 7-day
                        Premium trial
                        is currently
                        active.
                      </p>
                    ) : (
                      <p>
                        You have an
                        active Premium
                        subscription.
                      </p>
                    )}

                    {isTrialing &&
                      subscription.trialEnd && (
                        <p>
                          Trial ends{" "}
                          <strong>
                            {formatSubscriptionDate(
                              subscription.trialEnd
                            )}
                          </strong>
                        </p>
                      )}

                    {!isTrialing &&
                      subscription.currentPeriodEnd && (
                        <p>
                          Current
                          billing period
                          ends{" "}
                          <strong>
                            {formatSubscriptionDate(
                              subscription.currentPeriodEnd
                            )}
                          </strong>
                        </p>
                      )}

                    {subscription.cancelAtPeriodEnd &&
                      subscription.currentPeriodEnd && (
                        <p className="settings-card__status settings-card__status--warning">
                          Your Premium
                          subscription
                          is scheduled
                          to end on{" "}
                          <strong>
                            {formatSubscriptionDate(
                              subscription.currentPeriodEnd
                            )}
                          </strong>
                          .
                        </p>
                      )}

                    <p className="settings-card__status">
                      Status:{" "}
                      {getSubscriptionStatusLabel()}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      You currently
                      have a free
                      Summarist
                      account.
                    </p>

                    <p className="settings-card__status">
                      Status: Basic
                    </p>
                  </>
                )}
              </div>

              {hasPremiumAccess ? (
                <button
                  type="button"
                  className="book-page__button"
                  onClick={
                    handleManageSubscription
                  }
                  disabled={
                    isManagingSubscription
                  }
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
                  Upgrade to Premium
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

        <section className="settings-card settings-card--account-actions">
          <h2>
            Account Actions
          </h2>

          <p>
            Sign out of your Summarist
            account on this device.
          </p>

          <button
            type="button"
            className="settings__logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut
              ? "Logging Out..."
              : "Log Out"}
          </button>
        </section>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() =>
            setShowAuthModal(false)
          }
        />
      )}
    </main>
  );
}

export default Settings;