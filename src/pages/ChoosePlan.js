import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { getSubscription } from "../utils/subscription";

function ChoosePlan() {
  const { currentUser } = useAuth();

  const [isAnnual, setIsAnnual] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [showAuthModal, setShowAuthModal] =
    useState(false);
  const [isCheckingOut, setIsCheckingOut] =
    useState(false);
  const [checkoutError, setCheckoutError] =
    useState("");

  const [subscription, setSubscription] =
    useState({
      plan: "basic",
      status: "inactive",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      trialEnd: null,
    });

  const [loadingSubscription, setLoadingSubscription] =
    useState(true);

  const loadSubscription = useCallback(
    async () => {
      if (!currentUser) {
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
      } finally {
        setLoadingSubscription(false);
      }
    },
    [currentUser]
  );

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
    (subscription.status === "trialing" ||
      subscription.status === "active");

  const isTrialing =
    isPremium &&
    subscription.status === "trialing";

  const isActive =
    isPremium &&
    subscription.status === "active";

  const isCanceled =
    subscription.status === "canceled";

  const isPastDue =
    subscription.status === "past_due";

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    const date = new Date(
      timestamp * 1000
    );

    if (Number.isNaN(date.getTime())) {
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

  const getTrialDaysRemaining = () => {
    if (!subscription.trialEnd) {
      return null;
    }

    const now = Date.now();

    const trialEnd =
      Number(subscription.trialEnd) *
      1000;

    const difference =
      trialEnd - now;

    if (difference <= 0) {
      return 0;
    }

    return Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );
  };

  const trialDaysRemaining =
    getTrialDaysRemaining();

  const toggleSection = (section) => {
    setOpenSection(
      openSection === section
        ? null
        : section
    );
  };

  const handleUpgrade = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (isPremium) {
      return;
    }

    setCheckoutError("");
    setIsCheckingOut(true);

    try {
      const functions = getFunctions();

      const createCheckoutSession =
        httpsCallable(
          functions,
          "createCheckoutSession"
        );

      const result =
        await createCheckoutSession({
          billingPeriod: isAnnual
            ? "yearly"
            : "monthly",
        });

      const checkoutUrl =
        result.data?.url;

      if (!checkoutUrl) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.href =
        checkoutUrl;
    } catch (error) {
      console.error(
        "Failed to start Stripe checkout:",
        error
      );

      setCheckoutError(
        "Unable to start checkout. Please try again."
      );

      setIsCheckingOut(false);
    }
  };

  return (
    <main className="choose-plan-page">
      <div className="choose-plan-page__container">
        <Link
          to="/settings"
          className="choose-plan-page__back"
        >
          ← Back to Settings
        </Link>

        <div className="choose-plan-page__header">
          <h1>Choose your plan</h1>

          <p>
            Unlock unlimited access to
            premium book summaries and
            audio.
          </p>
        </div>

        {currentUser &&
          !loadingSubscription && (
            <div className="plan-status">
              <div>
                <span>
                  Current plan
                </span>

                <strong>
                  {isPremium
                    ? "Premium"
                    : "Basic"}
                </strong>
              </div>

              {isTrialing && (
                <div>
                  <span>
                    Trial status
                  </span>

                  <strong>
                    {trialDaysRemaining ===
                    0
                      ? "Trial ending"
                      : `${trialDaysRemaining} ${
                          trialDaysRemaining ===
                          1
                            ? "day"
                            : "days"
                        } remaining`}
                  </strong>
                </div>
              )}

              {isActive &&
                !subscription.cancelAtPeriodEnd && (
                  <div>
                    <span>
                      Subscription
                    </span>

                    <strong>
                      Active
                    </strong>
                  </div>
                )}

              {subscription.cancelAtPeriodEnd && (
                <div>
                  <span>
                    Subscription
                  </span>

                  <strong>
                    Ends{" "}
                    {formatDate(
                      subscription.currentPeriodEnd
                    )}
                  </strong>
                </div>
              )}

              {isPastDue && (
                <div>
                  <span>
                    Subscription
                  </span>

                  <strong>
                    Payment required
                  </strong>
                </div>
              )}

              {isCanceled && (
                <div>
                  <span>
                    Subscription
                  </span>

                  <strong>
                    Canceled
                  </strong>
                </div>
              )}
            </div>
          )}

        {isTrialing && (
          <div
            className="plan-trial"
            role="status"
          >
            <h2>
              Your Premium trial is active
            </h2>

            <p>
              You currently have access to
              Premium features.
            </p>

            {subscription.trialEnd && (
              <p>
                Your trial ends on{" "}
                <strong>
                  {formatDate(
                    subscription.trialEnd
                  )}
                </strong>
                .
              </p>
            )}

            {trialDaysRemaining !==
              null && (
              <div className="plan-trial__countdown">
                <strong>
                  {trialDaysRemaining}
                </strong>

                <span>
                  {trialDaysRemaining === 1
                    ? "day remaining"
                    : "days remaining"}
                </span>
              </div>
            )}
          </div>
        )}

        {subscription.cancelAtPeriodEnd &&
          isPremium && (
            <div
              className="plan-notice"
              role="status"
            >
              <strong>
                Cancellation scheduled
              </strong>

              <p>
                Your Premium access remains
                active until{" "}
                <strong>
                  {formatDate(
                    subscription.currentPeriodEnd
                  )}
                </strong>
                .
              </p>

              <p>
                You can manage your
                subscription from Settings.
              </p>
            </div>
          )}

        {isPastDue && (
          <div
            className="plan-notice plan-notice--warning"
            role="alert"
          >
            <strong>
              Payment attention required
            </strong>

            <p>
              There is an issue with your
              Premium subscription payment.
              Manage your subscription from
              Settings to review your billing
              information.
            </p>
          </div>
        )}

        <div className="plan-toggle">
          <button
            type="button"
            className={
              !isAnnual
                ? "plan-toggle__active"
                : ""
            }
            onClick={() =>
              setIsAnnual(false)
            }
            disabled={
              isCheckingOut ||
              isPremium
            }
          >
            Monthly
          </button>

          <button
            type="button"
            className={
              isAnnual
                ? "plan-toggle__active"
                : ""
            }
            onClick={() =>
              setIsAnnual(true)
            }
            disabled={
              isCheckingOut ||
              isPremium
            }
          >
            Yearly
          </button>
        </div>

        <div className="plans">
          <section className="plan-card">
            <h2>Basic</h2>

            <p className="plan-card__description">
              Get started with access to
              free content.
            </p>

            <div className="plan-card__price">
              <strong>$0</strong>
              <span>/ month</span>
            </div>

            <ul className="plan-card__features">
              <li>
                Free book summaries
              </li>

              <li>
                Audio playback
              </li>

              <li>
                Personal library
              </li>
            </ul>

            <button
              type="button"
              className="plan-card__button plan-card__button--secondary"
              disabled
            >
              {isPremium
                ? "Basic plan"
                : "Current plan"}
            </button>
          </section>

          <section className="plan-card plan-card--premium">
            <div className="plan-card__badge">
              Premium
            </div>

            <h2>Premium</h2>

            <p className="plan-card__description">
              Get unlimited access to the
              full Summarist library.
            </p>

            <div className="plan-card__price">
              <strong>
                {isAnnual
                  ? "$89.99"
                  : "$9.99"}
              </strong>

              <span>
                {isAnnual
                  ? "/ year"
                  : "/ month"}
              </span>
            </div>

            {!isPremium && (
              <p className="plan-card__trial">
                Includes a 7-day free trial
              </p>
            )}

            <ul className="plan-card__features">
              <li>
                Unlimited book summaries
              </li>

              <li>
                Unlimited audio
              </li>

              <li>
                Personal library
              </li>

              <li>
                Premium books
              </li>

              <li>
                New content regularly
              </li>
            </ul>

            <button
              type="button"
              className="plan-card__button"
              onClick={handleUpgrade}
              disabled={
                isCheckingOut ||
                isPremium
              }
            >
              {isCheckingOut
                ? "Opening checkout..."
                : isPremium
                  ? "Current plan"
                  : "Start Free Trial"}
            </button>

            {checkoutError && (
              <p
                className="plan-card__error"
                role="alert"
              >
                {checkoutError}
              </p>
            )}
          </section>
        </div>

        <section className="plan-faq">
          <h2>
            Frequently asked questions
          </h2>

          <div className="plan-faq__item">
            <button
              type="button"
              onClick={() =>
                toggleSection(1)
              }
              aria-expanded={
                openSection === 1
              }
            >
              What is included with
              Premium?

              <span>
                {openSection === 1
                  ? "−"
                  : "+"}
              </span>
            </button>

            {openSection === 1 && (
              <p>
                Premium gives you access
                to premium book summaries,
                audio playback, and the
                full Summarist library.
              </p>
            )}
          </div>

          <div className="plan-faq__item">
            <button
              type="button"
              onClick={() =>
                toggleSection(2)
              }
              aria-expanded={
                openSection === 2
              }
            >
              Can I cancel my
              subscription?

              <span>
                {openSection === 2
                  ? "−"
                  : "+"}
              </span>
            </button>

            {openSection === 2 && (
              <p>
                You can manage and cancel
                your subscription from your
                account settings.
              </p>
            )}
          </div>

          <div className="plan-faq__item">
            <button
              type="button"
              onClick={() =>
                toggleSection(3)
              }
              aria-expanded={
                openSection === 3
              }
            >
              Is there a free trial?

              <span>
                {openSection === 3
                  ? "−"
                  : "+"}
              </span>
            </button>

            {openSection === 3 && (
              <p>
                Premium includes a 7-day
                free trial before the
                subscription begins billing.
              </p>
            )}
          </div>

          <div className="plan-faq__item">
            <button
              type="button"
              onClick={() =>
                toggleSection(4)
              }
              aria-expanded={
                openSection === 4
              }
            >
              Can I switch between monthly
              and yearly?

              <span>
                {openSection === 4
                  ? "−"
                  : "+"}
              </span>
            </button>

            {openSection === 4 && (
              <p>
                Yes. Select your preferred
                billing period before
                starting your subscription.
              </p>
            )}
          </div>
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

export default ChoosePlan;