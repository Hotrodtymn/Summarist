const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
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
        throw new HttpsError("invalid-argument", "Invalid billing period.");
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

          success_url: "http://localhost:3000/settings?subscription=success",

          cancel_url: "http://localhost:3000/choose-plan?subscription=cancelled",

          customer_email: request.auth.token.email || undefined,
        });

        return {
          url: session.url,
        };
      } catch (error) {
        console.error("Stripe Checkout session creation failed:", error);

        throw new HttpsError("internal", "Unable to create checkout session.");
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

        res.status(400).send("Webhook signature verification failed.");

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
                  updatedAt: Date.now(),
                });

            console.log("Premium subscription saved for:", firebaseUid);

            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object;

            const firebaseUid = subscription.metadata?.firebaseUid;

            if (!firebaseUid) {
              console.error("No Firebase UID found on subscription.");

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
                  updatedAt: Date.now(),
                });

            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object;

            const firebaseUid = subscription.metadata?.firebaseUid;

            if (!firebaseUid) {
              console.error("No Firebase UID found on deleted subscription.");

              break;
            }

            await admin
                .database()
                .ref(`users/${firebaseUid}/subscription`)
                .update({
                  plan: "basic",
                  status: "canceled",
                  stripeSubscriptionId: subscription.id,
                  updatedAt: Date.now(),
                });

            break;
          }

          default:
            console.log(`Unhandled Stripe event: ${event.type}`);
        }

        res.status(200).json({
          received: true,
        });
      } catch (error) {
        console.error("Stripe webhook processing failed:", error);

        res.status(500).send("Webhook processing failed.");
      }
    },
);
