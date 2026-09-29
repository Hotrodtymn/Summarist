const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const MONTHLY_PRICE_ID = "price_1UKlj8ARBLemtUtQsztUXLU5";
const YEARLY_PRICE_ID = "price_1UKlj8ARBLemtUtQ8ejdANfm";

exports.createCheckoutSession = onCall(
    {
      secrets: [stripeSecretKey],
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in to subscribe.",
        );
      }

      const {billingPeriod} = request.data;

      let priceId;

      if (billingPeriod === "monthly") {
        priceId = MONTHLY_PRICE_ID;
      } else if (billingPeriod === "yearly") {
        priceId = YEARLY_PRICE_ID;
      } else {
        throw new HttpsError(
            "invalid-argument",
            "Invalid billing period.",
        );
      }

      const stripe = new Stripe(stripeSecretKey.value());

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",

          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],

          subscription_data: {
            trial_period_days: 7,

            metadata: {
              firebaseUid: request.auth.uid,
            },
          },

          client_reference_id: request.auth.uid,

          success_url:
          "https://summarist-ebon.vercel.app/settings?subscription=success",

          cancel_url:
          "https://summarist-ebon.vercel.app/choose-plan?subscription=cancelled",

          customer_email: request.auth.token.email || undefined,
        });

        const subscriptionId =
  typeof session.subscription === "string" ?
    session.subscription :
    session.subscription?.id;

        let trialEnd = null;
        let currentPeriodEnd = null;
        let cancelAtPeriodEnd = false;

        if (subscriptionId) {
          const subscription =
    await stripe.subscriptions.retrieve(
        subscriptionId,
    );

          trialEnd = subscription.trial_end || null;

          currentPeriodEnd =
    subscription.current_period_end || null;

          cancelAtPeriodEnd =
    subscription.cancel_at_period_end || false;
        }

        await admin
            .database()
            .ref(`users/${request.auth.uid}/subscription`)
            .update({
              plan: "premium",
              status: "trialing",
              stripeCustomerId:
      typeof session.customer === "string" ?
        session.customer :
        session.customer?.id || null,
              stripeSubscriptionId:
      subscriptionId || null,
              cancelAtPeriodEnd,
              currentPeriodEnd,
              trialEnd,
              updatedAt: Date.now(),
            });

        return {
          url: session.url,
        };
      } catch (error) {
        console.error(
            "Stripe Checkout session creation failed:",
            error,
        );

        throw new HttpsError(
            "internal",
            "Unable to create checkout session.",
        );
      }
    },
);

exports.createCustomerPortalSession = onCall(
    {
      secrets: [stripeSecretKey],
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in to manage your subscription.",
        );
      }

      const userId = request.auth.uid;

      try {
        const subscriptionSnapshot = await admin
            .database()
            .ref(`users/${userId}/subscription`)
            .once("value");

        const subscription = subscriptionSnapshot.val();

        const customerId = subscription?.stripeCustomerId;

        if (!customerId) {
          throw new HttpsError(
              "failed-precondition",
              "No Stripe customer was found for this account.",
          );
        }

        const stripe = new Stripe(stripeSecretKey.value());

        const portalSession =
        await stripe.billingPortal.sessions.create({
          customer: customerId,

          return_url:
            "https://summarist-ebon.vercel.app/settings",
        });

        return {
          url: portalSession.url,
        };
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        console.error(
            "Stripe Customer Portal session creation failed:",
            error,
        );

        throw new HttpsError(
            "internal",
            "Unable to open subscription management.",
        );
      }
    },
);

exports.stripeWebhook = onRequest(
    {
      secrets: [stripeSecretKey, stripeWebhookSecret],
    },
    async (req, res) => {
      console.log("Stripe webhook received:", req.method);

      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");

        return;
      }

      const stripe = new Stripe(stripeSecretKey.value());

      const signature = req.headers["stripe-signature"];

      if (!signature) {
        res.status(400).send("Missing Stripe signature.");

        return;
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            stripeWebhookSecret.value(),
        );
      } catch (error) {
        console.error(
            "Stripe webhook signature verification failed:",
            error.message,
        );

        res.status(400).send(
            "Webhook signature verification failed.",
        );

        return;
      }

      try {
        console.log("Stripe event:", event.type);

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;

            const firebaseUid = session.client_reference_id;

            if (!firebaseUid) {
              console.error("No Firebase UID found.");

              break;
            }

            const subscriptionId =
            typeof session.subscription === "string" ?
              session.subscription :
              session.subscription?.id;

            const customerId =
            typeof session.customer === "string" ?
              session.customer :
              session.customer?.id;

            await admin
                .database()
                .ref(`users/${firebaseUid}/subscription`)
                .update({
                  plan: "premium",
                  status: "trialing",
                  stripeCustomerId: customerId || null,
                  stripeSubscriptionId: subscriptionId || null,
                  cancelAtPeriodEnd: false,
                  currentPeriodEnd: null,
                  trialEnd: null,
                  updatedAt: Date.now(),
                });

            console.log(
                "Premium subscription saved for:",
                firebaseUid,
            );

            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object;

            const firebaseUid =
            subscription.metadata?.firebaseUid;

            if (!firebaseUid) {
              console.error(
                  "No Firebase UID found on subscription.",
              );

              break;
            }

            const isPremium =
            subscription.status === "active" ||
            subscription.status === "trialing";

            await admin
                .database()
                .ref(`users/${firebaseUid}/subscription`)
                .update({
                  plan: isPremium ? "premium" : "basic",
                  status: subscription.status,

                  stripeCustomerId:
                typeof subscription.customer === "string" ?
                  subscription.customer :
                  subscription.customer?.id || null,

                  stripeSubscriptionId: subscription.id,

                  cancelAtPeriodEnd:
                subscription.cancel_at_period_end || false,

                  currentPeriodEnd:
                subscription.current_period_end || null,

                  trialEnd:
                subscription.trial_end || null,

                  updatedAt: Date.now(),
                });

            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object;

            const firebaseUid =
            subscription.metadata?.firebaseUid;

            if (!firebaseUid) {
              console.error(
                  "No Firebase UID found on deleted subscription.",
              );

              break;
            }

            await admin
                .database()
                .ref(`users/${firebaseUid}/subscription`)
                .update({
                  plan: "basic",
                  status: "canceled",
                  stripeSubscriptionId: subscription.id,
                  cancelAtPeriodEnd: false,
                  currentPeriodEnd:
                subscription.current_period_end || null,
                  trialEnd:
                subscription.trial_end || null,
                  updatedAt: Date.now(),
                });

            break;
          }

          default:
            console.log(
                `Unhandled Stripe event: ${event.type}`,
            );
        }

        res.status(200).json({
          received: true,
        });
      } catch (error) {
        console.error(
            "Stripe webhook processing failed:",
            error,
        );

        res.status(500).send(
            "Webhook processing failed.",
        );
      }
    },
);

exports.getProtectedBook = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be signed in to access this book.",
    );
  }

  const bookId = request.data?.bookId;

  if (!bookId) {
    throw new HttpsError(
        "invalid-argument",
        "A book ID is required.",
    );
  }

  const userId = request.auth.uid;

  try {
    const subscriptionSnapshot = await admin
        .database()
        .ref(`users/${userId}/subscription`)
        .once("value");

    const subscription = subscriptionSnapshot.val();

    const isPremium =
      subscription &&
      subscription.plan === "premium" &&
      (
        subscription.status === "trialing" ||
        subscription.status === "active"
      );

    const bookResponse = await fetch(
        `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${bookId}`,
    );

    if (!bookResponse.ok) {
      throw new HttpsError(
          "not-found",
          "Book could not be found.",
      );
    }

    const book = await bookResponse.json();

    if (book.subscriptionRequired && !isPremium) {
      throw new HttpsError(
          "permission-denied",
          "Premium subscription required.",
      );
    }

    let protectedAudioLink = book.audioLink;

    if (book.audioLink) {
      try {
        const audioUrl = new URL(book.audioLink);

        const encodedPath =
          audioUrl.pathname.split("/o/")[1];

        if (!encodedPath) {
          throw new Error(
              "Unable to determine audio file path.",
          );
        }

        const filePath =
          decodeURIComponent(encodedPath);

        const bucket =
          admin.storage().bucket(
              "summaristt.appspot.com",
          );

        const file = bucket.file(filePath);

        const [signedUrl] =
          await file.getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 5 * 60 * 1000,
          });

        protectedAudioLink = signedUrl;
      } catch (audioError) {
        console.error(
            "Failed to create protected audio URL:",
            audioError,
        );

        throw new HttpsError(
            "internal",
            "Unable to secure the book audio.",
        );
      }
    }

    return {
      ...book,
      audioLink: protectedAudioLink,
      accessGranted: true,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error(
        "Protected book error:",
        error,
    );

    throw new HttpsError(
        "internal",
        "Unable to load the book.",
    );
  }
});
