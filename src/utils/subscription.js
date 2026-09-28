import { get, ref } from "firebase/database";
import { database } from "../firebase";

export async function getSubscription(userId) {
  if (!userId) {
    return {
      plan: "basic",
      status: "inactive",
    };
  }

  try {
    const subscriptionRef = ref(database, `users/${userId}/subscription`);

    const snapshot = await get(subscriptionRef);

    if (!snapshot.exists()) {
      return {
        plan: "basic",
        status: "inactive",
      };
    }

    const subscription = snapshot.val();

    return {
      plan: subscription.plan || "basic",
      status: subscription.status || "inactive",
    };
  } catch (error) {
    console.error("Failed to get subscription:", error);

    return {
      plan: "basic",
      status: "inactive",
    };
  }
}

export async function getSubscriptionStatus(userId) {
  const subscription = await getSubscription(userId);

  return subscription.plan;
}

export async function isPremiumUser(userId) {
  const subscription = await getSubscription(userId);

  return (
    subscription.plan === "premium" &&
    (subscription.status === "trialing" || subscription.status === "active")
  );
}
