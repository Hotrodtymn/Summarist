import { get, ref } from "firebase/database";
import { database } from "../firebase";

const DEFAULT_SUBSCRIPTION = {
  plan: "basic",
  status: "inactive",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  trialEnd: null,
};

export async function getSubscription(userId) {
  if (!userId) {
    return DEFAULT_SUBSCRIPTION;
  }

  try {
    const subscriptionRef = ref(
      database,
      `users/${userId}/subscription`
    );

    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      return DEFAULT_SUBSCRIPTION;
    }

    const subscription = snapshot.val();

    return {
      plan: subscription.plan || "basic",
      status: subscription.status || "inactive",
      cancelAtPeriodEnd:
        subscription.cancelAtPeriodEnd || false,
      currentPeriodEnd:
        subscription.currentPeriodEnd || null,
      trialEnd:
        subscription.trialEnd || null,
    };
  } catch (error) {
    console.error(
      "Failed to get subscription:",
      error
    );

    return DEFAULT_SUBSCRIPTION;
  }
}

export async function getSubscriptionStatus(userId) {
  const subscription =
    await getSubscription(userId);

  return subscription.plan;
}

export async function isPremiumUser(userId) {
  const subscription =
    await getSubscription(userId);

  return (
    subscription.plan === "premium" &&
    (
      subscription.status === "trialing" ||
      subscription.status === "active"
    )
  );
}