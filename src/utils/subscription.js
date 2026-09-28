import { get, ref, update } from "firebase/database";
import { database } from "../firebase";

export async function getSubscriptionStatus(userId) {
  if (!userId) {
    return "basic";
  }

  try {
    const userRef = ref(
      database,
      `users/${userId}/subscription`
    );

    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return "basic";
    }

    const subscription = snapshot.val();

    return subscription.plan || "basic";
  } catch (error) {
    console.error(
      "Failed to get subscription status:",
      error
    );

    return "basic";
  }
}

export async function setSubscriptionStatus(
  userId,
  plan
) {
  if (!userId) {
    return;
  }

  try {
    const subscriptionRef = ref(
      database,
      `users/${userId}/subscription`
    );

    await update(subscriptionRef, {
      plan,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error(
      "Failed to update subscription status:",
      error
    );

    throw error;
  }
}